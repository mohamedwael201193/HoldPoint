import { query } from "./_generated/server";

export const providers = query({
  args: {},
  handler: async () => {
    return {
      openai: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
      agentmail: Boolean(process.env.AGENTMAIL_API_KEY),
      agentmailWebhook: Boolean(process.env.AGENTMAIL_WEBHOOK_SECRET),
      agentmailInbox: Boolean(process.env.AGENTMAIL_INBOX_ID),
      primaryLanguage: process.env.OPENAI_API_KEY
        ? ("openai" as const)
        : process.env.GEMINI_API_KEY
          ? ("gemini" as const)
          : ("rules" as const),
    };
  },
});

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const permits = await ctx.db.query("permits").collect();
    const inspections = await ctx.db.query("inspections").collect();
    const activity = await ctx.db.query("activity").order("desc").take(12);
    const proofs = await ctx.db.query("reliabilityProofs").order("desc").take(20);
    const failed = inspections.filter((row) => row.status === "failed").length;
    const watching = permits.filter((row) => row.watchActive).length;
    return {
      permitCount: permits.length,
      watching,
      inspectionCount: inspections.length,
      failedInspections: failed,
      scrapeCount: permits.reduce((sum, row) => sum + row.scrapeCount, 0),
      lastActivity: activity,
      proofCount: proofs.length,
      proofsPassed: proofs.filter((row) => row.passed).length,
    };
  },
});
