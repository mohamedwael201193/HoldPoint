import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { parseTradeReply } from "./engine/intent";
import { extractRoutingToken, formatRoutingToken } from "./engine/routing";
import { alreadyRecorded } from "./guards";
import type { Id } from "./_generated/dataModel";
import {
  agentMailIdempotencyKey,
  isLabeledDemoAddress,
  parseInboundPayload,
  sendInboxMessage,
} from "./model/agentmail";
import { draftChaseEmail, parseTradeReplyWithLanguage } from "./model/ai";
import { quoteExistsInSource } from "./engine/quotes";

export const listInbound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inboundEmails").order("desc").take(40);
  },
});

export const listOutbound = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("outboundSends").order("desc").take(40);
  },
});

export const ingestVerified = internalMutation({
  args: {
    fromEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    providerMessageId: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("inboundEmails")
      .withIndex("byProviderMessageId", (q) =>
        q.eq("providerMessageId", args.providerMessageId),
      )
      .unique();
    if (alreadyRecorded(existing)) {
      return { duplicate: true as const, inboundId: existing._id };
    }

    const org = await ctx.db.query("orgs").first();
    if (!org) throw new Error("No organization");

    const token = extractRoutingToken(`${args.subject}\n${args.body}`);
    const permit = token
      ? await ctx.db
          .query("permits")
          .withIndex("byRoutingToken", (q) => q.eq("routingToken", token))
          .first()
      : null;

    const parsed = parseTradeReply(args.body);
    const inboundId = await ctx.db.insert("inboundEmails", {
      orgId: org._id,
      permitId: permit?._id,
      fromEmail: args.fromEmail,
      subject: args.subject,
      body: args.body,
      providerMessageId: args.providerMessageId,
      routedToken: token ?? undefined,
      intent: parsed.intent,
      receivedAt: Date.now(),
    });

    await ctx.db.insert("activity", {
      orgId: org._id,
      permitId: permit?._id,
      kind: "inbound_email",
      sponsor: "agentmail",
      durationMs: 0,
      summary: token
        ? `Routed ${token} as ${parsed.intent}`
        : "Inbound email missing routing token; held for review",
      createdAt: Date.now(),
    });

    return {
      duplicate: false as const,
      inboundId,
      permitId: permit?._id ?? null,
      token,
      intent: parsed.intent,
      needsHumanReview: parsed.needsHumanReview,
    };
  },
});

export const applyReplyConstraints = internalMutation({
  args: {
    permitId: v.id("permits"),
    inboundId: v.id("inboundEmails"),
    intent: v.string(),
    unavailableFrom: v.union(v.number(), v.null()),
    unavailableTo: v.union(v.number(), v.null()),
    needsHumanReview: v.boolean(),
    quote: v.string(),
    source: v.string(),
    engine: v.union(v.literal("openai"), v.literal("gemini"), v.literal("rules")),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    const inbound = await ctx.db.get(args.inboundId);
    if (!inbound) throw new Error("Inbound missing");

    const quoteOk = quoteExistsInSource(args.source, args.quote);
    await ctx.db.insert("decisions", {
      permitId: permit._id,
      kind: "reply_intent",
      engine: args.engine,
      inputDigest: inbound.providerMessageId,
      answers: JSON.stringify({
        intent: args.intent,
        quoteOk,
        needsHumanReview: args.needsHumanReview,
      }),
      confidence: quoteOk && !args.needsHumanReview ? 0.8 : 0.3,
      createdAt: Date.now(),
    });

    if (!quoteOk || args.needsHumanReview) {
      await ctx.db.insert("activity", {
        orgId: permit.orgId,
        permitId: permit._id,
        kind: "reply_held",
        sponsor: "convex",
        durationMs: 0,
        summary: quoteOk
          ? "Trade reply needs human review before calendar mutation"
          : "Trade reply quote failed source verification",
        createdAt: Date.now(),
      });
      return { applied: false as const };
    }

    if (args.intent === "unavailable" && args.unavailableFrom && args.unavailableTo) {
      const trade = await ctx.db
        .query("trades")
        .withIndex("byOrg", (q) => q.eq("orgId", permit.orgId))
        .filter((q) => q.eq(q.field("email"), inbound.fromEmail))
        .first();
      const fallback = trade ?? (await ctx.db.query("trades").withIndex("byOrg", (q) => q.eq("orgId", permit.orgId)).first());
      if (fallback) {
        await ctx.db.patch(fallback._id, {
          unavailable: [
            ...fallback.unavailable,
            { from: args.unavailableFrom, to: args.unavailableTo },
          ],
          revision: fallback.revision + 1,
        });
      }
    }

    await ctx.db.patch(permit._id, {
      constraintRevision: permit.constraintRevision + 1,
    });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "constraint_updated",
      sponsor: "convex",
      durationMs: 0,
      summary: `Trade intent ${args.intent} applied`,
      createdAt: Date.now(),
    });
    return { applied: true as const };
  },
});

type InboundResult = {
  duplicate: boolean;
  inboundId: Id<"inboundEmails">;
  permitId?: Id<"permits"> | null;
  token?: string | null;
  intent?: string;
  needsHumanReview?: boolean;
  applied?: boolean;
  engine?: "openai" | "gemini" | "rules";
};

export const processInbound = internalAction({
  args: {
    fromEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    providerMessageId: v.string(),
    eventType: v.string(),
  },
  handler: async (ctx, args): Promise<InboundResult> => {
    const ingested: InboundResult = await ctx.runMutation(
      internal.mail.ingestVerified,
      args,
    );
    if (ingested.duplicate || !ingested.permitId) return ingested;
    const language = await parseTradeReplyWithLanguage(args.body);
    const quote = language.value.quote;
    const applied: { applied: boolean } = await ctx.runMutation(
      internal.mail.applyReplyConstraints,
      {
        permitId: ingested.permitId,
        inboundId: ingested.inboundId,
        intent: language.value.intent,
        unavailableFrom: language.value.unavailableFrom,
        unavailableTo: language.value.unavailableTo,
        needsHumanReview: language.value.needsHumanReview,
        quote,
        source: args.body,
        engine: language.engine,
      },
    );
    if (applied.applied) {
      await ctx.runMutation(internal.plans.writeFromWatch, {
        permitId: ingested.permitId,
      });
    }
    return { ...ingested, applied: applied.applied, engine: language.engine };
  },
});

export const simulateInbound = action({
  args: {
    fromEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    providerMessageId: v.string(),
  },
  handler: async (ctx, args): Promise<InboundResult> => {
    return await ctx.runAction(internal.mail.processInbound, {
      ...args,
      eventType: "demo.inject",
    });
  },
});

export const recordOutbound = internalMutation({
  args: {
    orgId: v.id("orgs"),
    permitId: v.id("permits"),
    toEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    idempotencyKey: v.string(),
    providerMessageId: v.optional(v.string()),
    providerThreadId: v.optional(v.string()),
    status: v.union(
      v.literal("sent"),
      v.literal("skipped_duplicate"),
      v.literal("skipped_demo"),
      v.literal("failed"),
      v.literal("budget_blocked"),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("outboundSends")
      .withIndex("byIdempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (alreadyRecorded(existing)) {
      if (
        existing.status === "sent" ||
        existing.status === "skipped_demo" ||
        existing.status === "skipped_duplicate" ||
        existing.status === "budget_blocked"
      ) {
        return { duplicate: true as const, sendId: existing._id };
      }
      await ctx.db.patch(existing._id, {
        subject: args.subject,
        body: args.body,
        status: args.status,
        sentAt: Date.now(),
      });
      return { duplicate: false as const, sendId: existing._id };
    }
    const sendId = await ctx.db.insert("outboundSends", {
      orgId: args.orgId,
      permitId: args.permitId,
      toEmail: args.toEmail,
      subject: args.subject,
      body: args.body,
      idempotencyKey: args.idempotencyKey,
      providerMessageId: args.providerMessageId,
      providerThreadId: args.providerThreadId,
      sentAt: Date.now(),
      status: args.status,
    });
    return { duplicate: false as const, sendId };
  },
});

export const loadNotifyContext = internalMutation({
  args: { permitId: v.id("permits"), tradeId: v.id("trades"), planId: v.id("schedulePlans") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    const trade = await ctx.db.get(args.tradeId);
    const org = permit ? await ctx.db.get(permit.orgId) : null;
    const assignment = await ctx.db
      .query("assignments")
      .withIndex("byPlan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("tradeId"), args.tradeId))
      .first();
    const inspection = assignment ? await ctx.db.get(assignment.inspectionId) : null;
    if (!permit || !trade || !org || !assignment || !inspection) return null;
    const start = new Date(assignment.windowStart).toISOString().slice(0, 10);
    const end = new Date(assignment.windowEnd).toISOString().slice(0, 10);
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const sentToday = (
      await ctx.db
        .query("outboundSends")
        .withIndex("byOrg", (q) => q.eq("orgId", org._id))
        .collect()
    ).filter((row) => row.sentAt >= dayStart.getTime() && row.status === "sent").length;
    const existingSend = await ctx.db
      .query("outboundSends")
      .withIndex("byIdempotencyKey", (q) =>
        q.eq(
          "idempotencyKey",
          agentMailIdempotencyKey("notify", args.planId, args.tradeId, inspection.code),
        ),
      )
      .unique();
    return {
      orgId: org._id,
      dailySendBudget: org.dailySendBudget,
      sentToday,
      permitId: permit._id,
      projectName: permit.projectName,
      routingToken: formatRoutingToken(permit.routingToken),
      tradeName: trade.name,
      toEmail: trade.email,
      inspectionCode: inspection.code,
      windowLabel: `${start} → ${end}`,
      idempotencyKey: agentMailIdempotencyKey("notify", args.planId, args.tradeId, inspection.code),
      existingStatus: existingSend?.status ?? null,
    };
  },
});

export const notifyTrade = internalAction({
  args: {
    permitId: v.id("permits"),
    tradeId: v.id("trades"),
    planId: v.id("schedulePlans"),
  },
  handler: async (ctx, args) => {
    const loaded = await ctx.runMutation(internal.mail.loadNotifyContext, args);
    if (!loaded) return { skipped: true as const, reason: "missing context" };
    if (
      loaded.existingStatus === "sent" ||
      loaded.existingStatus === "skipped_demo" ||
      loaded.existingStatus === "skipped_duplicate"
    ) {
      return { skipped: true as const, reason: "idempotent replay" };
    }
    if (loaded.sentToday >= loaded.dailySendBudget) {
      await ctx.runMutation(internal.mail.recordOutbound, {
        orgId: loaded.orgId,
        permitId: loaded.permitId,
        toEmail: loaded.toEmail,
        subject: `${loaded.routingToken} ${loaded.inspectionCode} window`,
        body: "",
        idempotencyKey: loaded.idempotencyKey,
        status: "budget_blocked",
      });
      return { skipped: true as const, reason: "daily send budget" };
    }

    const draft = await draftChaseEmail({
      tradeName: loaded.tradeName,
      inspectionCode: loaded.inspectionCode,
      windowLabel: loaded.windowLabel,
      routingToken: loaded.routingToken,
      projectName: loaded.projectName,
    });

    if (isLabeledDemoAddress(loaded.toEmail)) {
      await ctx.runMutation(internal.mail.recordOutbound, {
        orgId: loaded.orgId,
        permitId: loaded.permitId,
        toEmail: loaded.toEmail,
        subject: draft.value.subject,
        body: draft.value.body,
        idempotencyKey: loaded.idempotencyKey,
        status: "skipped_demo",
      });
      await ctx.runMutation(internal.mail.recordActivity, {
        orgId: loaded.orgId,
        permitId: loaded.permitId,
        kind: "mail_skipped_demo",
        summary: `Labeled demo inbox; live send not attempted for ${loaded.inspectionCode}`,
      });
      return { skipped: true as const, reason: "demo trade address" };
    }

    const apiKey = process.env.AGENTMAIL_API_KEY;
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    if (!apiKey || !inboxId) {
      await ctx.runMutation(internal.mail.recordOutbound, {
        orgId: loaded.orgId,
        permitId: loaded.permitId,
        toEmail: loaded.toEmail,
        subject: draft.value.subject,
        body: draft.value.body,
        idempotencyKey: loaded.idempotencyKey,
        status: "failed",
      });
      return { skipped: true as const, reason: "mailbox not configured" };
    }

    const existing = await ctx.runMutation(internal.mail.recordOutbound, {
      orgId: loaded.orgId,
      permitId: loaded.permitId,
      toEmail: loaded.toEmail,
      subject: draft.value.subject,
      body: draft.value.body,
      idempotencyKey: loaded.idempotencyKey,
      status: "sent",
    });
    if (existing.duplicate) {
      return { skipped: true as const, reason: "idempotent replay" };
    }

    const sent = await sendInboxMessage({
      inboxId,
      apiKey,
      to: loaded.toEmail,
      subject: draft.value.subject,
      text: draft.value.body,
      idempotencyKey: loaded.idempotencyKey,
    });
    if (!sent.ok) {
      await ctx.runMutation(internal.mail.markSendStatus, {
        sendId: existing.sendId,
        status: "failed",
        error: sent.error,
      });
      return { skipped: true as const, reason: sent.error };
    }
    await ctx.runMutation(internal.mail.markSendStatus, {
      sendId: existing.sendId,
      status: "sent",
      providerMessageId: sent.messageId,
      providerThreadId: sent.threadId,
    });
    return { skipped: false as const, messageId: sent.messageId, engine: draft.engine };
  },
});

export const recordActivity = internalMutation({
  args: {
    orgId: v.id("orgs"),
    permitId: v.optional(v.id("permits")),
    kind: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activity", {
      orgId: args.orgId,
      permitId: args.permitId,
      kind: args.kind,
      sponsor: "agentmail",
      durationMs: 0,
      summary: args.summary,
      createdAt: Date.now(),
    });
  },
});

export const demoMailboxContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db.query("orgs").first();
    if (!org) return null;
    const permit = await ctx.db
      .query("permits")
      .withIndex("byOrg", (q) => q.eq("orgId", org._id))
      .first();
    return {
      orgId: org._id,
      permitId: permit?._id,
      routingToken: permit ? formatRoutingToken(permit.routingToken) : "[HP-NONE]",
      projectName: permit?.projectName ?? "HoldPoint",
    };
  },
});

export const markSendStatus = internalMutation({
  args: {
    sendId: v.id("outboundSends"),
    status: v.union(
      v.literal("sent"),
      v.literal("skipped_duplicate"),
      v.literal("skipped_demo"),
      v.literal("failed"),
      v.literal("budget_blocked"),
    ),
    error: v.optional(v.string()),
    providerMessageId: v.optional(v.string()),
    providerThreadId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.sendId);
    if (!row) return;
    await ctx.db.patch(args.sendId, {
      status: args.status,
      providerMessageId: args.providerMessageId ?? row.providerMessageId,
      providerThreadId: args.providerThreadId ?? row.providerThreadId,
    });
    if (args.error) {
      await ctx.db.insert("activity", {
        orgId: row.orgId,
        permitId: row.permitId,
        kind: "mail_failed",
        sponsor: "agentmail",
        durationMs: 0,
        summary: args.error.slice(0, 240),
        createdAt: Date.now(),
      });
    }
  },
});

export const acceptWebhook = internalAction({
  args: { raw: v.string(), eventId: v.string() },
  handler: async (ctx, args): Promise<InboundResult> => {
    const parsed = parseInboundPayload(args.raw);
    if (!parsed) throw new Error("Unrecognized inbound payload");
    return await ctx.runAction(internal.mail.processInbound, {
      fromEmail: parsed.fromEmail,
      subject: parsed.subject,
      body: parsed.body,
      providerMessageId: parsed.providerMessageId || args.eventId,
      eventType: parsed.eventType,
    });
  },
});

export const proveLiveSend = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    ok: boolean;
    reason?: string;
    duplicate?: boolean;
    messageId?: string;
  }> => {
    const apiKey = process.env.AGENTMAIL_API_KEY;
    const inboxId = process.env.AGENTMAIL_INBOX_ID;
    if (!apiKey || !inboxId) {
      return { ok: false, reason: "mailbox not configured" };
    }
    const demo = await ctx.runQuery(internal.mail.demoMailboxContext, {});
    if (!demo?.permitId) return { ok: false, reason: "seed demo workspace first" };
    const day = new Date().toISOString().slice(0, 10);
    const idempotencyKey = agentMailIdempotencyKey("live-loopback", day);
    const subject = `${demo.routingToken} live mailbox proof`;
    const body = [
      `HoldPoint loopback send for ${demo.projectName}.`,
      `This is a real AgentMail send to the configured coordination inbox.`,
      `Reply with ${demo.routingToken} to route inbound into the permit.`,
    ].join("\n");
    const reserved = await ctx.runMutation(internal.mail.recordOutbound, {
      orgId: demo.orgId,
      permitId: demo.permitId,
      toEmail: inboxId,
      subject,
      body,
      idempotencyKey,
      status: "sent",
    });
    if (reserved.duplicate) {
      return { ok: true, duplicate: true, reason: "idempotent replay" };
    }
    const sent = await sendInboxMessage({
      inboxId,
      apiKey,
      to: inboxId,
      subject,
      text: body,
      idempotencyKey,
    });
    if (!sent.ok) {
      await ctx.runMutation(internal.mail.markSendStatus, {
        sendId: reserved.sendId,
        status: "failed",
        error: sent.error,
      });
      return { ok: false, reason: sent.error };
    }
    await ctx.runMutation(internal.mail.markSendStatus, {
      sendId: reserved.sendId,
      status: "sent",
      providerMessageId: sent.messageId,
      providerThreadId: sent.threadId,
    });
    await ctx.runMutation(internal.mail.recordActivity, {
      orgId: demo.orgId,
      permitId: demo.permitId,
      kind: "mail_sent",
      summary: `Live AgentMail send ${sent.messageId}`,
    });
    return { ok: true, messageId: sent.messageId };
  },
});

export const replaySend = mutation({
  args: { idempotencyKey: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("outboundSends")
      .withIndex("byIdempotencyKey", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (!existing) return { replayed: false, reason: "no ledger row" };
    return { replayed: true, sendId: existing._id, status: existing.status };
  },
});
