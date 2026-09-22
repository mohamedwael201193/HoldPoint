import { mutation } from "./_generated/server";

const INSPECTION_CATALOG = [
  { code: "site", name: "Site / erosion", requiresTrade: "gc", dependsOn: [], typicalLeadDays: 1 },
  { code: "footing", name: "Footing", requiresTrade: "gc", dependsOn: ["site"], typicalLeadDays: 2 },
  {
    code: "rough-electrical",
    name: "Rough-in electrical",
    requiresTrade: "electrical",
    dependsOn: ["footing"],
    typicalLeadDays: 2,
  },
  {
    code: "rough-plumbing",
    name: "Rough-in plumbing",
    requiresTrade: "plumbing",
    dependsOn: ["footing"],
    typicalLeadDays: 2,
  },
  {
    code: "insulation",
    name: "Insulation",
    requiresTrade: "insulation",
    dependsOn: ["rough-electrical", "rough-plumbing"],
    typicalLeadDays: 1,
  },
  {
    code: "final",
    name: "Final",
    requiresTrade: "gc",
    dependsOn: ["insulation"],
    typicalLeadDays: 2,
  },
] as const;

export const demoWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("orgs").first();
    if (existing) {
      const permit = await ctx.db
        .query("permits")
        .withIndex("byOrg", (q) => q.eq("orgId", existing._id))
        .first();
      return { orgId: existing._id, permitId: permit?._id ?? null, reused: true };
    }

    const now = Date.now();
    const orgId = await ctx.db.insert("orgs", {
      name: "HoldPoint demo GC",
      timezone: "America/Indiana/Indianapolis",
      dailySendBudget: 80,
      constraintRevision: 0,
      createdAt: now,
    });

    const cityId = await ctx.db.insert("cities", {
      name: "Indianapolis",
      state: "IN",
      portalKind: "accela",
      statusUrlTemplate:
        "https://aca-prod.accela.com/INDY/Cap/CapHome.aspx?module=Building&TabName=Building",
      statusVocabulary: [
        { raw: "Issued", semantic: "progressed" },
        { raw: "In Review", semantic: "informational" },
        { raw: "Comments Emailed", semantic: "action_required" },
        { raw: "Inspection Failed", semantic: "failed" },
        { raw: "Finaled", semantic: "progressed" },
      ],
      lastVerifiedAt: now,
      createdAt: now,
    });

    for (const row of INSPECTION_CATALOG) {
      await ctx.db.insert("inspectionTypes", {
        cityId,
        code: row.code,
        name: row.name,
        requiresTrade: row.requiresTrade,
        dependsOn: [...row.dependsOn],
        typicalLeadDays: row.typicalLeadDays,
      });
    }

    const trades = [
      { kind: "electrical", name: "Demo Electrical (seeded inbox)", email: "trades-electrical@example.invalid" },
      { kind: "plumbing", name: "Demo Plumbing (seeded inbox)", email: "trades-plumbing@example.invalid" },
      { kind: "insulation", name: "Demo Insulation (seeded inbox)", email: "trades-insulation@example.invalid" },
      { kind: "gc", name: "Demo GC self-perform", email: "gc@example.invalid" },
    ];
    const tradeIds = [];
    for (const trade of trades) {
      tradeIds.push(
        await ctx.db.insert("trades", {
          orgId,
          kind: trade.kind,
          name: trade.name,
          email: trade.email,
          unavailable: [],
          revision: 0,
          createdAt: now,
        }),
      );
    }
    void tradeIds;

    const permitId = await ctx.db.insert("permits", {
      orgId,
      cityId,
      permitNumber: "BLD-DEMO-0001",
      permitType: "Building — new construction",
      projectName: "Riverside duplex (demo project, labeled)",
      statusRaw: "Issued",
      statusSemantic: "progressed",
      statusChangedAt: now,
      contentHash: "",
      sourceUrl:
        "https://aca-prod.accela.com/INDY/Cap/CapHome.aspx?module=Building&TabName=Building",
      routingToken: "HP-RIV1",
      watchActive: true,
      constraintRevision: 0,
      scrapeCount: 0,
      createdAt: now,
    });

    for (const row of INSPECTION_CATALOG) {
      await ctx.db.insert("inspections", {
        permitId,
        code: row.code,
        status: row.code === "site" ? "passed" : "pending",
        revision: 0,
      });
    }

    await ctx.db.insert("activity", {
      orgId,
      permitId,
      kind: "seed",
      sponsor: "convex",
      durationMs: 0,
      summary:
        "Seeded demo project. City portal URL is real Accela search; permit number and trades are labeled demo data.",
      createdAt: now,
    });

    return { orgId, permitId, reused: false };
  },
});
