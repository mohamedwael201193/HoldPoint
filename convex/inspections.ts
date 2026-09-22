import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { assertWritable, requireCurrentRevision } from "./guards";

export const markFailed = mutation({
  args: {
    inspectionId: v.id("inspections"),
    expectedRevision: v.number(),
    excerpt: v.string(),
  },
  handler: async (ctx, args) => {
    const inspection = await ctx.db.get(args.inspectionId);
    if (!inspection) throw new Error("Inspection not found");
    const permit = await ctx.db.get(inspection.permitId);
    if (!permit) throw new Error("Permit not found");
    assertWritable(permit.frozen);
    requireCurrentRevision(args.expectedRevision, permit.constraintRevision);
    await ctx.db.patch(inspection._id, {
      status: "failed",
      resultPostedAt: Date.now(),
      failureExcerpts: [...(inspection.failureExcerpts ?? []), args.excerpt],
      scheduledFor: undefined,
    });
    await ctx.db.patch(permit._id, {
      constraintRevision: permit.constraintRevision + 1,
      statusRaw: "Inspection Failed",
      statusSemantic: "failed",
      statusChangedAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "inspection_failed",
      sponsor: "convex",
      durationMs: 0,
      summary: `${inspection.code} failed; dependents will be repaired`,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.plans.writeFromWatch, {
      permitId: permit._id,
    });
    return { queued: true as const, permitId: permit._id };
  },
});
