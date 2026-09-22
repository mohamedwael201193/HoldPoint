import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { notifyTargets, repair } from "./engine/repair";
import { InfeasibleScheduleError, type InspectionInput, type TradeInput } from "./engine/types";
import { assertWritable, requireCurrentRevision } from "./guards";
import { mailPool } from "./pools";
import { internal } from "./_generated/api";

export const write = mutation({
  args: {
    permitId: v.id("permits"),
    expectedRevision: v.number(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    assertWritable(permit.frozen);
    requireCurrentRevision(args.expectedRevision, permit.constraintRevision);
    return await writePlan(ctx, permit);
  },
});

export const writeFromWatch = internalMutation({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    assertWritable(permit.frozen);
    return await writePlan(ctx, permit);
  },
});

async function writePlan(ctx: MutationCtx, permit: Doc<"permits">) {
  const inspections = await ctx.db
    .query("inspections")
    .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
    .collect();
  const types = await ctx.db
    .query("inspectionTypes")
    .withIndex("byCity", (q) => q.eq("cityId", permit.cityId))
    .collect();
  const typeByCode = new Map(types.map((row) => [row.code, row]));
  const trades = await ctx.db
    .query("trades")
    .withIndex("byOrg", (q) => q.eq("orgId", permit.orgId))
    .collect();

  const latest = await ctx.db
    .query("schedulePlans")
    .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
    .order("desc")
    .first();
  const previousRows = latest
    ? await ctx.db
        .query("assignments")
        .withIndex("byPlan", (q) => q.eq("planId", latest._id))
        .collect()
    : [];

  const engineInspections: InspectionInput[] = inspections.map((row) => {
    const type = typeByCode.get(row.code);
    if (!type) throw new Error(`Missing inspection type ${row.code}`);
    return {
      code: row.code,
      status: row.status,
      dependsOn: type.dependsOn,
      typicalLeadDays: type.typicalLeadDays,
      durationDays: 1,
      tradeKind: type.requiresTrade,
      lockedWindow:
        row.status === "scheduled" && row.scheduledFor
          ? { start: row.scheduledFor, end: row.scheduledFor + 86_400_000 }
          : null,
    };
  });
  const engineTrades: TradeInput[] = trades.map((row) => ({
    id: row._id,
    kind: row.kind,
    unavailable: row.unavailable,
  }));

  try {
    const { result, diff } = repair(
      { now: Date.now(), inspections: engineInspections, trades: engineTrades },
      previousRows.map((row) => {
        const inspection = inspections.find((item) => item._id === row.inspectionId);
        return {
          inspectionCode: inspection?.code ?? "",
          tradeId: row.tradeId,
          windowStart: row.windowStart,
          windowEnd: row.windowEnd,
        };
      }),
    );

    const revision = permit.constraintRevision + 1;
    const planId = await ctx.db.insert("schedulePlans", {
      permitId: permit._id,
      revision,
      closingDate: result.closingDate,
      criticalPathDays: result.criticalPathDays,
      provenExact: result.provenExact,
      gap: result.gap,
      createdAt: Date.now(),
    });

    const inspectionByCode = new Map(inspections.map((row) => [row.code, row]));
    for (const assignment of result.assignments) {
      const inspection = inspectionByCode.get(assignment.inspectionCode);
      if (!inspection) continue;
      await ctx.db.insert("assignments", {
        planId,
        permitId: permit._id,
        inspectionId: inspection._id,
        tradeId: assignment.tradeId as Id<"trades">,
        windowStart: assignment.windowStart,
        windowEnd: assignment.windowEnd,
        state: "proposed",
      });
      await ctx.db.patch(inspection._id, {
        scheduledFor: assignment.windowStart,
        revision,
      });
    }

    await ctx.db.patch(permit._id, { constraintRevision: revision });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "schedule_written",
      sponsor: "convex",
      durationMs: 0,
      summary: `Plan r${revision} closing in ${result.criticalPathDays} days`,
      createdAt: Date.now(),
    });

    const notify = notifyTargets(diff);
    for (const tradeId of notify) {
      await mailPool.enqueueAction(
        ctx,
        internal.mail.notifyTrade,
        {
          permitId: permit._id,
          tradeId: tradeId as Id<"trades">,
          planId,
        },
        { retry: true },
      );
    }

    return {
      planId,
      revision,
      closingDate: result.closingDate,
      criticalPath: result.criticalPath,
      provenExact: result.provenExact,
      assignmentCount: result.assignments.length,
      notified: notify.length,
      infeasible: false as const,
    };
  } catch (error) {
    if (error instanceof InfeasibleScheduleError) {
      await ctx.db.insert("activity", {
        orgId: permit.orgId,
        permitId: permit._id,
        kind: "schedule_infeasible",
        sponsor: "convex",
        durationMs: 0,
        summary: error.message,
        createdAt: Date.now(),
      });
      return {
        planId: null,
        revision: permit.constraintRevision,
        closingDate: 0,
        criticalPath: [] as string[],
        provenExact: false,
        assignmentCount: 0,
        notified: 0,
        infeasible: true as const,
        reason: error.message,
      };
    }
    throw error;
  }
}
