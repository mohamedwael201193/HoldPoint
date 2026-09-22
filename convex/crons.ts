import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "permit standing watch",
  { minutes: 15 },
  internal.watchJobs.tick,
  {},
);

export default crons;
