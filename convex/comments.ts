import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { quoteExistsInSource } from "./engine/quotes";
import { extractRequirements } from "./model/ai";

export const insertComment = internalMutation({
  args: {
    permitId: v.id("permits"),
    sourceKind: v.union(v.literal("forwardedEmail"), v.literal("scraped")),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    return await ctx.db.insert("comments", {
      permitId: args.permitId,
      sourceKind: args.sourceKind,
      text: args.text,
      ingestedAt: Date.now(),
    });
  },
});

export const applyExtractions = internalMutation({
  args: {
    permitId: v.id("permits"),
    commentId: v.id("comments"),
    engine: v.union(v.literal("openai"), v.literal("gemini"), v.literal("rules")),
    drafts: v.array(
      v.object({
        text: v.string(),
        quote: v.string(),
        evidenceRequired: v.string(),
      }),
    ),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    let applied = 0;
    let held = 0;
    for (const draft of args.drafts) {
      const verified = quoteExistsInSource(args.source, draft.quote);
      await ctx.db.insert("requirements", {
        permitId: args.permitId,
        commentId: args.commentId,
        text: draft.text,
        evidenceRequired: draft.evidenceRequired,
        quotedFromSource: draft.quote,
        verified,
        status: verified ? "open" : "unverified",
      });
      if (verified) applied += 1;
      else held += 1;
    }
    await ctx.db.insert("decisions", {
      permitId: args.permitId,
      kind: "status_semantics",
      engine: args.engine,
      inputDigest: args.commentId,
      answers: JSON.stringify({ applied, held }),
      confidence: held === 0 ? 0.7 : 0.2,
      createdAt: Date.now(),
    });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "requirements_extracted",
      sponsor:
        args.engine === "openai"
          ? "openai"
          : args.engine === "gemini"
            ? "gemini"
            : "convex",
      durationMs: 0,
      summary: `${applied} quote-verified, ${held} held for review`,
      createdAt: Date.now(),
    });
    return { applied, held };
  },
});

export const ingest = action({
  args: {
    permitId: v.id("permits"),
    text: v.string(),
    sourceKind: v.union(v.literal("forwardedEmail"), v.literal("scraped")),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    commentId: Id<"comments">;
    engine: "openai" | "gemini" | "rules";
    applied: number;
    held: number;
  }> => {
    const commentId: Id<"comments"> = await ctx.runMutation(
      internal.comments.insertComment,
      {
        permitId: args.permitId,
        sourceKind: args.sourceKind,
        text: args.text,
      },
    );
    const extracted = await extractRequirements(args.text);
    const result = await ctx.runMutation(internal.comments.applyExtractions, {
      permitId: args.permitId,
      commentId,
      engine: extracted.engine,
      drafts: extracted.value,
      source: args.text,
    });
    return { commentId, engine: extracted.engine, ...result };
  },
});
