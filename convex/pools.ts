import { Workpool } from "@convex-dev/workpool";
import { components } from "./_generated/api";

export const scrapePool = new Workpool(components.scrapePool, {
  maxParallelism: 4,
});

export const mailPool = new Workpool(components.mailPool, {
  maxParallelism: 1,
});
