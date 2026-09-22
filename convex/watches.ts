import { v } from "convex/values";
import type { GenericActionCtx } from "convex/server";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { DataModel, Id } from "./_generated/dataModel";
import { sha256Hex } from "./engine/hash";
import { extractStatus, normalizeStatus, watchFingerprint } from "./engine/normalize";
import { firecrawl } from "./model/firecrawl";

export const getRecord = internalQuery({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args) => ctx.db.get(args.permitId),
});

export const recordFetch = internalMutation({
  args: {
    permitId: v.id("permits"),
    url: v.string(),
    markdown: v.string(),
    contentHash: v.string(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    const unchanged = permit.contentHash === args.contentHash && permit.contentHash !== "";
    await ctx.db.insert("permitSources", {
      permitId: args.permitId,
      url: args.url,
      markdown: args.markdown.slice(0, 80_000),
      contentHash: args.contentHash,
      scrapedAt: Date.now(),
    });
    if (unchanged) {
      await ctx.db.patch(args.permitId, {
        lastScrapeAt: Date.now(),
        lastScrapeError: "",
        scrapeCount: permit.scrapeCount + 1,
      });
      await ctx.db.insert("activity", {
        orgId: permit.orgId,
        permitId: permit._id,
        kind: "watch_unchanged",
        sponsor: "firecrawl",
        durationMs: args.durationMs,
        summary: "Source hash unchanged; no downstream language spend",
        createdAt: Date.now(),
      });
      return {
        unchanged: true as const,
        error: null as string | null,
        contentHash: args.contentHash,
      };
    }

    const city = await ctx.db.get(permit.cityId);
    const statusRaw = extractStatus(args.markdown) ?? permit.statusRaw;
    const statusSemantic = normalizeStatus(statusRaw, city?.statusVocabulary ?? []);
    await ctx.db.patch(args.permitId, {
      statusRaw,
      statusSemantic,
      statusChangedAt: Date.now(),
      contentHash: args.contentHash,
      lastScrapeAt: Date.now(),
      lastScrapeError: "",
      scrapeCount: permit.scrapeCount + 1,
    });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "watch_changed",
      sponsor: "firecrawl",
      durationMs: args.durationMs,
      summary: `Status now ${statusRaw}`,
      createdAt: Date.now(),
    });
    return {
      unchanged: false as const,
      error: null as string | null,
      contentHash: args.contentHash,
      statusRaw,
      statusSemantic,
    };
  },
});

export const recordFetchError = internalMutation({
  args: { permitId: v.id("permits"), error: v.string(), durationMs: v.number() },
  handler: async (ctx, args) => {
    const permit = await ctx.db.get(args.permitId);
    if (!permit) throw new Error("Permit not found");
    await ctx.db.patch(args.permitId, {
      lastScrapeAt: Date.now(),
      lastScrapeError: args.error.slice(0, 500),
    });
    await ctx.db.insert("activity", {
      orgId: permit.orgId,
      permitId: permit._id,
      kind: "watch_error",
      sponsor: "firecrawl",
      durationMs: args.durationMs,
      summary: "Public source fetch failed; last verified status kept",
      createdAt: Date.now(),
    });
    return {
      unchanged: true as const,
      error: args.error,
      contentHash: permit.contentHash,
    };
  },
});

type FetchResult = {
  unchanged: boolean;
  error: string | null;
  contentHash: string;
  statusRaw?: string;
  statusSemantic?: string;
};

export const fetchOne = action({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args): Promise<FetchResult> => {
    const result = await runFetch(ctx, args.permitId);
    if (!result.unchanged && !result.error) {
      await ctx.runMutation(internal.plans.writeFromWatch, { permitId: args.permitId });
    }
    return result;
  },
});

export const fetchOneInternal = internalAction({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args): Promise<FetchResult> => runFetch(ctx, args.permitId),
});

async function runFetch(
  ctx: GenericActionCtx<DataModel>,
  permitId: Id<"permits">,
): Promise<FetchResult> {
  const permit = await ctx.runQuery(internal.watches.getRecord, { permitId });
  if (!permit?.sourceUrl) {
    throw new Error("Permit has no source URL");
  }
  const started = Date.now();
  try {
    const page = await firecrawl.scrape(ctx, permit.sourceUrl, {
      formats: ["markdown"],
      maxAge: 0,
    });
    const markdown = page.markdown ?? "";
    const contentHash = await sha256Hex(watchFingerprint(markdown));
    return await ctx.runMutation(internal.watches.recordFetch, {
      permitId,
      url: permit.sourceUrl,
      markdown,
      contentHash,
      durationMs: Date.now() - started,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "scrape failed";
    return await ctx.runMutation(internal.watches.recordFetchError, {
      permitId,
      error: message,
      durationMs: Date.now() - started,
    });
  }
}
