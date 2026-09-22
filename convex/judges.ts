import { query } from "./_generated/server";

export const snapshot = query({
  args: {},
  handler: async (ctx) => {
    const org = await ctx.db.query("orgs").first();
    const permit = org
      ? await ctx.db
          .query("permits")
          .withIndex("byOrg", (q) => q.eq("orgId", org._id))
          .first()
      : null;
    const city = permit ? await ctx.db.get(permit.cityId) : null;
    const inspections = permit
      ? await ctx.db
          .query("inspections")
          .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
          .collect()
      : [];
    const plan = permit
      ? await ctx.db
          .query("schedulePlans")
          .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
          .order("desc")
          .first()
      : null;
    const assignments = plan
      ? await ctx.db
          .query("assignments")
          .withIndex("byPlan", (q) => q.eq("planId", plan._id))
          .collect()
      : [];
    const trades = org
      ? await ctx.db
          .query("trades")
          .withIndex("byOrg", (q) => q.eq("orgId", org._id))
          .collect()
      : [];
    const sources = permit
      ? await ctx.db
          .query("permitSources")
          .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
          .order("desc")
          .take(5)
      : [];
    const activity = permit
      ? await ctx.db
          .query("activity")
          .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
          .order("desc")
          .take(25)
      : [];
    const requirements = permit
      ? await ctx.db
          .query("requirements")
          .withIndex("byPermit", (q) => q.eq("permitId", permit._id))
          .collect()
      : [];
    const proofs = await ctx.db.query("reliabilityProofs").order("desc").take(20);
    const inbound = await ctx.db.query("inboundEmails").order("desc").take(10);
    const outbound = await ctx.db.query("outboundSends").order("desc").take(10);

    return {
      org,
      permit,
      city,
      inspections,
      plan,
      assignments,
      trades,
      sources: sources.map((row) => ({
        _id: row._id,
        url: row.url,
        contentHash: row.contentHash,
        scrapedAt: row.scrapedAt,
        markdownPreview: row.markdown.slice(0, 400),
      })),
      activity,
      requirements,
      proofs,
      inbound,
      outbound,
    };
  },
});
