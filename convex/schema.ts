import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const semanticStatus = v.union(
  v.literal("progressed"),
  v.literal("stalled"),
  v.literal("action_required"),
  v.literal("failed"),
  v.literal("informational"),
  v.literal("unknown"),
);

const inspectionStatus = v.union(
  v.literal("pending"),
  v.literal("requested"),
  v.literal("scheduled"),
  v.literal("passed"),
  v.literal("failed"),
);

const assignmentState = v.union(
  v.literal("proposed"),
  v.literal("notified"),
  v.literal("confirmed"),
  v.literal("declined"),
  v.literal("rescheduled"),
);

export default defineSchema({
  orgs: defineTable({
    name: v.string(),
    timezone: v.string(),
    dailySendBudget: v.number(),
    constraintRevision: v.number(),
    createdAt: v.number(),
  }),

  cities: defineTable({
    name: v.string(),
    state: v.string(),
    portalKind: v.union(
      v.literal("accela"),
      v.literal("etrakit"),
      v.literal("custom"),
    ),
    statusUrlTemplate: v.string(),
    statusVocabulary: v.array(v.object({ raw: v.string(), semantic: v.string() })),
    lastVerifiedAt: v.number(),
    createdAt: v.number(),
  }),

  permits: defineTable({
    orgId: v.id("orgs"),
    cityId: v.id("cities"),
    permitNumber: v.string(),
    permitType: v.string(),
    projectName: v.string(),
    statusRaw: v.string(),
    statusSemantic: v.optional(semanticStatus),
    statusChangedAt: v.number(),
    contentHash: v.string(),
    sourceUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    routingToken: v.string(),
    watchActive: v.boolean(),
    constraintRevision: v.number(),
    frozen: v.optional(v.boolean()),
    lastScrapeAt: v.optional(v.number()),
    lastScrapeError: v.optional(v.string()),
    scrapeCount: v.number(),
    createdAt: v.number(),
  })
    .index("byOrg", ["orgId"])
    .index("byCity", ["cityId"])
    .index("byOrgPermit", ["orgId", "permitNumber"])
    .index("byRoutingToken", ["routingToken"]),

  permitSources: defineTable({
    permitId: v.id("permits"),
    url: v.string(),
    markdown: v.string(),
    contentHash: v.string(),
    scrapedAt: v.number(),
  }).index("byPermit", ["permitId"]),

  inspectionTypes: defineTable({
    cityId: v.id("cities"),
    code: v.string(),
    name: v.string(),
    requiresTrade: v.string(),
    dependsOn: v.array(v.string()),
    typicalLeadDays: v.number(),
  }).index("byCity", ["cityId"]),

  inspections: defineTable({
    permitId: v.id("permits"),
    code: v.string(),
    status: inspectionStatus,
    scheduledFor: v.optional(v.number()),
    resultPostedAt: v.optional(v.number()),
    failureExcerpts: v.optional(v.array(v.string())),
    sourceId: v.optional(v.id("permitSources")),
    revision: v.number(),
  }).index("byPermit", ["permitId"]),

  trades: defineTable({
    orgId: v.id("orgs"),
    kind: v.string(),
    name: v.string(),
    email: v.string(),
    unavailable: v.array(v.object({ from: v.number(), to: v.number() })),
    revision: v.number(),
    createdAt: v.number(),
  }).index("byOrg", ["orgId"]),

  schedulePlans: defineTable({
    permitId: v.id("permits"),
    revision: v.number(),
    closingDate: v.number(),
    criticalPathDays: v.number(),
    provenExact: v.boolean(),
    gap: v.optional(v.number()),
    createdAt: v.number(),
  }).index("byPermit", ["permitId"]),

  assignments: defineTable({
    planId: v.id("schedulePlans"),
    permitId: v.id("permits"),
    inspectionId: v.id("inspections"),
    tradeId: v.id("trades"),
    windowStart: v.number(),
    windowEnd: v.number(),
    state: assignmentState,
  })
    .index("byPermit", ["permitId"])
    .index("byTrade", ["tradeId"])
    .index("byPlan", ["planId"]),

  comments: defineTable({
    permitId: v.id("permits"),
    sourceKind: v.union(v.literal("forwardedEmail"), v.literal("scraped")),
    text: v.string(),
    ingestedAt: v.number(),
  }).index("byPermit", ["permitId"]),

  requirements: defineTable({
    permitId: v.id("permits"),
    commentId: v.id("comments"),
    text: v.string(),
    evidenceRequired: v.string(),
    quotedFromSource: v.string(),
    verified: v.boolean(),
    appliesToCode: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("satisfied"),
      v.literal("waived"),
      v.literal("unverified"),
    ),
  }).index("byPermit", ["permitId"]),

  outboundSends: defineTable({
    orgId: v.id("orgs"),
    permitId: v.optional(v.id("permits")),
    toEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    idempotencyKey: v.string(),
    providerMessageId: v.optional(v.string()),
    providerThreadId: v.optional(v.string()),
    sentAt: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("skipped_duplicate"),
      v.literal("skipped_demo"),
      v.literal("failed"),
      v.literal("budget_blocked"),
    ),
  })
    .index("byIdempotencyKey", ["idempotencyKey"])
    .index("byOrg", ["orgId"]),

  inboundEmails: defineTable({
    orgId: v.id("orgs"),
    permitId: v.optional(v.id("permits")),
    fromEmail: v.string(),
    subject: v.string(),
    body: v.string(),
    providerMessageId: v.string(),
    routedToken: v.optional(v.string()),
    intent: v.optional(v.string()),
    receivedAt: v.number(),
  }).index("byProviderMessageId", ["providerMessageId"]),

  decisions: defineTable({
    permitId: v.optional(v.id("permits")),
    kind: v.union(
      v.literal("status_semantics"),
      v.literal("next_action"),
      v.literal("urgency"),
      v.literal("reply_intent"),
      v.literal("send_gate"),
    ),
    engine: v.union(v.literal("openai"), v.literal("gemini"), v.literal("rules")),
    inputDigest: v.string(),
    answers: v.string(),
    confidence: v.number(),
    createdAt: v.number(),
  }).index("byPermit", ["permitId"]),

  activity: defineTable({
    orgId: v.id("orgs"),
    permitId: v.optional(v.id("permits")),
    kind: v.string(),
    sponsor: v.union(
      v.literal("firecrawl"),
      v.literal("openai"),
      v.literal("gemini"),
      v.literal("agentmail"),
      v.literal("convex"),
    ),
    durationMs: v.number(),
    summary: v.string(),
    createdAt: v.number(),
  })
    .index("byOrg", ["orgId"])
    .index("byPermit", ["permitId"]),

  reliabilityProofs: defineTable({
    attack: v.string(),
    expectedBehavior: v.string(),
    actualBehavior: v.string(),
    passed: v.boolean(),
    ranAt: v.number(),
  }),
});
