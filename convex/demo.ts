import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const REVIEWER_LETTER = `City of Indianapolis — plan review comments (demo excerpt, labeled).

The submitted structural package is incomplete. Provide revised structural calculations for the east footing. Shop drawings shall match the issued permit set. Insulation inspection is required after rough-in electrical and plumbing have passed.

Status: Comments Emailed
`;

export const bootstrap = action({
  args: {},
  handler: async (ctx): Promise<{
    seed: { orgId: Id<"orgs">; permitId: Id<"permits"> | null; reused: boolean };
    plan: unknown;
    requirements: unknown;
    proofs: unknown;
    honesty: Record<string, string>;
  }> => {
    const seed: { orgId: Id<"orgs">; permitId: Id<"permits"> | null; reused: boolean } =
      await ctx.runMutation(api.seed.demoWorkspace, {});
    if (!seed.permitId) throw new Error("Seed did not return a permit");
    const detail = await ctx.runQuery(api.permits.get, { permitId: seed.permitId });
    const expectedRevision: number = detail?.permit.constraintRevision ?? 0;
    const plan = await ctx.runMutation(api.plans.write, {
      permitId: seed.permitId,
      expectedRevision,
    });
    const requirements = await ctx.runAction(api.comments.ingest, {
      permitId: seed.permitId,
      sourceKind: "forwardedEmail",
      text: REVIEWER_LETTER,
    });
    const proofs = await ctx.runMutation(api.reliability.runSuite, {});
    return {
      seed,
      plan,
      requirements,
      proofs: proofs.results,
      honesty: {
        cityPortal: "real Accela public search URL",
        permitNumber: "labeled demo",
        trades: "labeled demo inboxes",
        reviewerLetter: "labeled demo excerpt",
      },
    };
  },
});
