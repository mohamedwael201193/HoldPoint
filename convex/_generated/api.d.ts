/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as demo from "../demo.js";
import type * as engine_clocks from "../engine/clocks.js";
import type * as engine_dag from "../engine/dag.js";
import type * as engine_hash from "../engine/hash.js";
import type * as engine_intent from "../engine/intent.js";
import type * as engine_normalize from "../engine/normalize.js";
import type * as engine_quotes from "../engine/quotes.js";
import type * as engine_repair from "../engine/repair.js";
import type * as engine_routing from "../engine/routing.js";
import type * as engine_schedule from "../engine/schedule.js";
import type * as engine_types from "../engine/types.js";
import type * as guards from "../guards.js";
import type * as health from "../health.js";
import type * as http from "../http.js";
import type * as inspections from "../inspections.js";
import type * as judges from "../judges.js";
import type * as mail from "../mail.js";
import type * as model_agentmail from "../model/agentmail.js";
import type * as model_ai from "../model/ai.js";
import type * as model_firecrawl from "../model/firecrawl.js";
import type * as model_svix from "../model/svix.js";
import type * as permits from "../permits.js";
import type * as plans from "../plans.js";
import type * as pools from "../pools.js";
import type * as reliability from "../reliability.js";
import type * as seed from "../seed.js";
import type * as watchJobs from "../watchJobs.js";
import type * as watchWorkflow from "../watchWorkflow.js";
import type * as watches from "../watches.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  comments: typeof comments;
  crons: typeof crons;
  demo: typeof demo;
  "engine/clocks": typeof engine_clocks;
  "engine/dag": typeof engine_dag;
  "engine/hash": typeof engine_hash;
  "engine/intent": typeof engine_intent;
  "engine/normalize": typeof engine_normalize;
  "engine/quotes": typeof engine_quotes;
  "engine/repair": typeof engine_repair;
  "engine/routing": typeof engine_routing;
  "engine/schedule": typeof engine_schedule;
  "engine/types": typeof engine_types;
  guards: typeof guards;
  health: typeof health;
  http: typeof http;
  inspections: typeof inspections;
  judges: typeof judges;
  mail: typeof mail;
  "model/agentmail": typeof model_agentmail;
  "model/ai": typeof model_ai;
  "model/firecrawl": typeof model_firecrawl;
  "model/svix": typeof model_svix;
  permits: typeof permits;
  plans: typeof plans;
  pools: typeof pools;
  reliability: typeof reliability;
  seed: typeof seed;
  watchJobs: typeof watchJobs;
  watchWorkflow: typeof watchWorkflow;
  watches: typeof watches;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  workflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"workflow">;
  scrapePool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"scrapePool">;
  mailPool: import("@convex-dev/workpool/_generated/component.js").ComponentApi<"mailPool">;
  staticHosting: import("@convex-dev/static-hosting/_generated/component.js").ComponentApi<"staticHosting">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
};
