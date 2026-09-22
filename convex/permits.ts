import { v } from "convex/values";
import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const permits = await ctx.db.query("permits").order("desc").take(50);
    const cities = await ctx.db.query("cities").collect();
    const cityById = new Map(cities.map((city) => [city._id, city]));
    return permits.map((permit) => ({
      _id: permit._id,
      permitNumber: permit.permitNumber,
      permitType: permit.permitType,
      projectName: permit.projectName,
      statusRaw: permit.statusRaw,
      statusSemantic: permit.statusSemantic,
      watchActive: permit.watchActive,
      sourceUrl: permit.sourceUrl,
      contentHash: permit.contentHash,
      lastScrapeAt: permit.lastScrapeAt,
      lastScrapeError: permit.lastScrapeError,
      scrapeCount: permit.scrapeCount,
      cityName: cityById.get(permit.cityId)?.name ?? "Unknown city",
      cityState: cityById.get(permit.cityId)?.state ?? "",
    }));
  },
});

export const get = query({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) return null;
    const city = await ctx.db.get(permit.cityId);
    const sources = await ctx.db
      .query("permitSources")
      .withIndex("byPermit", (q) => q.eq("permitId", args.permitId))
      .order("desc")
      .take(10);
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("byPermit", (q) => q.eq("permitId", args.permitId))
      .collect();
    const plans = await ctx.db
      .query("schedulePlans")
      .withIndex("byPermit", (q) => q.eq("permitId", args.permitId))
      .order("desc")
      .take(1);
    const plan = plans[0] ?? null;
    const assignments = plan
      ? await ctx.db
          .query("assignments")
          .withIndex("byPlan", (q) => q.eq("planId", plan._id))
          .collect()
      : [];
    const activity = await ctx.db
      .query("activity")
      .withIndex("byPermit", (q) => q.eq("permitId", args.permitId))
      .order("desc")
      .take(40);
    return {
      permit,
      city,
      sources,
      inspections,
      plan: plans[0] ?? null,
      assignments,
      activity,
    };
  },
});
