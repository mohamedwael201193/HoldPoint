import { v } from "convex/values";
import { internal } from "./_generated/api";
import { scrapePool } from "./pools";
import { internalMutation } from "./_generated/server";

export const tick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const permits = await ctx.db.query("permits").collect();
    let queued = 0;
    for (const permit of permits) {
      if (!permit.watchActive || !permit.sourceUrl) continue;
      await scrapePool.enqueueAction(
        ctx,
        internal.watches.fetchOneInternal,
        { permitId: permit._id },
        { retry: true },
      );
      queued += 1;
    }
    return { queued };
  },
});

export const startWatch = internalMutation({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args) => {
    await scrapePool.enqueueAction(
      ctx,
      internal.watches.fetchOneInternal,
      { permitId: args.permitId },
      { retry: true },
    );
  },
});
