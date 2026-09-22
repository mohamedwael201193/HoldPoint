import { WorkflowManager } from "@convex-dev/workflow";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { mutation } from "./_generated/server";

export const workflow = new WorkflowManager(components.workflow);

export const watchPermit = workflow
  .define({
    args: { permitId: v.id("permits") },
  })
  .handler(async (step, args): Promise<{ unchanged: boolean }> => {
    const fetch = await step.runAction(
      internal.watches.fetchOneInternal,
      { permitId: args.permitId },
      { retry: true },
    );
    if (fetch.unchanged) return { unchanged: true };
    await step.runMutation(internal.plans.writeFromWatch, {
      permitId: args.permitId,
    });
    return { unchanged: false };
  });

export const kick = mutation({
  args: { permitId: v.id("permits") },
  handler: async (ctx, args): Promise<string> => {
    return await workflow.start(ctx, internal.watchWorkflow.watchPermit, {
      permitId: args.permitId,
    });
  },
});
