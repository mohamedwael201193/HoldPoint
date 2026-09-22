# IMPLEMENTATION_PLAN

**Product:** HoldPoint  
**Date:** 2026-09-22  
**Depends on:** `PROJECT_BASELINE.md`, research files 01–04, official docs listed per phase.  
**Order:** research lock → audit (done) → this plan → implementation. Do not skip the spine for polish.

**Identity lock**

- HoldPoint is the standing watch for construction permits and inspections.
- Firecrawl retrieves real public pages. Convex stores durable state and recomputes a dependency-aware schedule **in the mutation that writes the plan**. AgentMail coordinates real email. OpenAI understands language only.
- AI understands. Deterministic code decides.
- No Next.js. React + Vite + TypeScript.
- Host the live app on `convex.site` ([All Gas rules](https://www.convex.dev/hackathons/all-gas)).
- Implementation files must not name the benchmark competitor, copy its code, or include the research-only decision-model vendor.
- Never invent APIs, SDK methods, municipal endpoints, or test counts.

**Cut lines (deadline day):** if hours run out, keep watch → classify (rules) → schedule → notify → reply → repair → `/judges` attacks 1–4. Drop PM digest, extra cities, brute-force exhaustive search, attacks 5–8, second live permit.

**Shared “do not invent”:** undocumented SDK methods, fake scrape payloads, fake email events, fake OpenAI calls, invented permit URLs, competitor names, secrets in git.

---

## PHASE 0 — Evidence lock + repository audit

**Goal:** Freeze sources of truth and the as-is repo.  
**Why:** Prevent building against stale assumptions.  
**Dependencies:** none.  
**Read first:** `01_*.md`–`04_*.md`; [hackathon](https://www.convex.dev/hackathons/all-gas); [Luma](https://luma.com/convex-allgas-hackathon).  
**Resources:** none.  
**Files:** CREATE `PROJECT_BASELINE.md` (done). MODIFY none. DO NOT TOUCH research files except to read.  
**Data model / API / Env:** none / none / names only in baseline.  
**Browser:** confirm console sessions exist (AgentMail, Firecrawl) without copying secrets.  
**Steps:** 1) Read all research. 2) Git/status/files audit. 3) Env names + key presence. 4) MCP inventory. 5) Write baseline.  
**Tests:** baseline contains no secret-shaped strings (`sk-`, `am_`, `fc-`, `ghp_`, `vcp_`, `whsec_`).  
**Failure:** missing discovery prompt files → proceed on 01–04 (recorded).  
**Security / idempotency / retry / observability:** do not print secrets; audit is read-only; n/a; n/a.  
**Acceptance:** `PROJECT_BASELINE.md` exists; secrets absent.  
**Demo-visible:** none.  
**Rollback:** delete baseline only.  
**Source confidence:** high (files on disk + live fetches this session).  
**Evidence:** this file + baseline.

---

## PHASE 1 — Project bootstrap + dependency validation

**Goal:** Vite + React 19 + TypeScript + Tailwind 4 + pnpm workspace that can build.  
**Why:** Frontend and Convex share one repo; judges clone a real app.  
**Dependencies:** Phase 0.  
**Read first:** Vite React-TS template; Tailwind v4 Vite guide; `PROJECT_BASELINE.md`.  
**Resources:** Node 24 (present).  
**Files:** CREATE `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`. MODIFY `package.json`, `.gitignore`. DO NOT TOUCH `.env`, research markdown.  
**Data model:** none. **API:** none.  
**Env:** none yet.  
**Browser:** none.  
**Steps:** 1) Write package.json with scripts `dev`, `build`, `preview`, `test`. 2) Install `react`, `react-dom`, `react-router`, `convex`, `tailwindcss`, `@tailwindcss/vite`, `typescript`, `vite`, `vitest`, `@types/react`, `@types/react-dom`, `lucide-react`. 3) Path alias `@/` → `src/`. 4) `pnpm build` must succeed on a placeholder page.  
**Tests:** `pnpm exec tsc --noEmit` clean.  
**Failure:** existing `shadcn`-only package.json → replace carefully, keep `@react-bits` registry.  
**Security:** no secrets in client bundle.  
**Idempotency / retry:** re-runnable installs.  
**Observability:** none.  
**Acceptance:** `pnpm build` exits 0; no Next.js dependency.  
**Demo-visible:** blank shell.  
**Rollback:** git revert bootstrap commit.  
**Do not invent:** Next.js routes, App Router.  
**Source confidence:** high.  
**Evidence:** build log.

---

## PHASE 2 — Convex foundation

**Goal:** `npx convex dev` linked deployment; generated API; static-hosting component mounted.  
**Why:** All durable state and HTTP live here; required sponsor.  
**Dependencies:** Phase 1.  
**Read first:** [Convex docs](https://docs.convex.dev/); [HTTP actions](https://docs.convex.dev/functions/http-actions); [env vars](https://docs.convex.dev/production/environment-variables); [components](https://www.convex.dev/components/); [workflow](https://www.npmjs.com/package/@convex-dev/workflow); [workpool](https://www.npmjs.com/package/@convex-dev/workpool); static-hosting package README.  
**Resources:** Convex account (create via CLI if needed).  
**Files:** CREATE `convex/convex.config.ts`, `convex/schema.ts` (stub then Phase 3), `convex/http.ts` (health), `convex/auth.config.ts` only if auth ships. MODIFY `package.json`.  
**Data model:** empty schema ok for ping.  
**API:** `GET /health` httpAction returns `{ ok: true }`.  
**Env:** set on Convex dashboard: later provider keys. `VITE_CONVEX_URL` locally after init.  
**Browser:** Convex dashboard to confirm deployment.  
**Steps:** 1) `pnpm add convex @convex-dev/workflow @convex-dev/workpool @convex-dev/static-hosting @firecrawl/firecrawl-convex`. 2) `npx convex init` / `npx convex dev --once`. 3) Mount workflow, workpool, static-hosting, Firecrawl component. 4) **Do not mount AgentMail component** unless a fresh package is proven to declare env (research: published package sandbox has empty env). 5) Health HTTP route.  
**Tests:** health curl against `.convex.site` after first deploy.  
**Failure:** login required → use CLI device flow.  
**Security:** deployment keys stay in Convex CLI store, not git.  
**Idempotency:** `convex dev --once` is safe.  
**Retry:** CLI retry.  
**Observability:** Convex logs.  
**Acceptance:** `_generated` exists locally (gitignored); deployment URL recorded in `APP_PUBLIC_URL` env (not committed).  
**Demo-visible:** none yet.  
**Rollback:** `npx convex disable` / delete deployment only if unused.  
**Do not invent:** `CONVEX_SITE_URL` domains.  
**Source confidence:** high.  
**Evidence:** `convex.json` / `.env.local` names only in gitignore.

---

## PHASE 3 — Database schema + invariants

**Goal:** Domain tables with indexes and revision counters.  
**Why:** The scheduler, watch, and email loop share one state machine.  
**Dependencies:** Phase 2.  
**Read first:** `04_FINAL_PRODUCT_BLUEPRINT.md` §7.1; Convex schema docs.  
**Resources:** none.  
**Files:** CREATE `convex/schema.ts`, `convex/lib/validators.ts`. MODIFY generated types via deploy.  
**Data model:** `orgs`, `cities`, `permits`, `permitSources`, `inspectionTypes`, `inspections`, `trades`, `schedulePlans`, `assignments`, `comments`, `requirements`, `outboundSends`, `inboundEmails`, `decisions` (engines: `openai` | `gemini` | `rules` only), `activity` (sponsors: firecrawl | openai | agentmail | convex), `reliabilityProofs`. Unique indexes: `outboundSends.byIdempotencyKey`, `inboundEmails.byProviderMessageId`.  
**API:** internal mutations only this phase.  
**Env:** none.  
**Browser:** none.  
**Steps:** 1) Encode validators. 2) Indexes matching blueprint. 3) No third-party decision-engine literals. 4) `orgs.constraintRevision` and `permits.constraintRevision`.  
**Tests:** `convex-test` insert + unique index collision.  
**Failure:** 1 MiB doc limit → store huge markdown in file storage later if needed; start with truncated snapshots + hash.  
**Security:** orgId on every query path from day one.  
**Idempotency:** unique provider message ids.  
**Retry:** n/a.  
**Observability:** `activity` table.  
**Acceptance:** schema deploys; TypeScript compiles.  
**Demo-visible:** none.  
**Rollback:** schema push reverse is additive-first; avoid destructive renames.  
**Do not invent:** extra tables unless a test proves a missing invariant.  
**Source confidence:** high (blueprint).  
**Evidence:** `npx convex dev --once` success.

---

## PHASE 4 — Deterministic scheduling engine

**Goal:** Pure functions: DAG, earliest-feasible schedule, minimum-disruption repair. Zero I/O.  
**Why:** This is the product’s decision core.  
**Dependencies:** Phase 3 types.  
**Read first:** blueprint §7.3, §11 of the user directive.  
**Resources:** none.  
**Files:** CREATE `convex/engine/types.ts`, `dag.ts`, `schedule.ts`, `repair.ts`, `clocks.ts`, `hash.ts`, `quotes.ts`. CREATE `tests/engine/*.test.ts`.  
**Data model:** engine inputs are plain objects, not Convex documents.  
**API:** called only from `plans.write` mutation (Phase 10/14).  
**Env:** none.  
**Browser:** none.  
**Steps:** 1) Build DAG from `dependsOn`. 2) Forward pass: lead days, trade unavailable windows, locked confirmed assignments. 3) `closingDate` = longest path. 4) `provenExact` true for n≤20; else greedy + gap. 5) Repair emits `{kept, moved, added, dropped}` and closing-date delta. 6) Never notify trades whose window did not change (diff is data; send is later).  
**Tests:** dependency order; no overlap on same trade; unavailable windows; impossible schedule throws; failed inspection repair; changed lead time; reversed input order same output; same instance twice.  
**Failure:** infeasible → throw; mutation must not write a wrong plan.  
**Security:** n/a.  
**Idempotency:** pure function.  
**Retry:** n/a.  
**Observability:** return `criticalPath` codes.  
**Acceptance:** vitest green for listed cases.  
**Demo-visible:** later repair diff card.  
**Rollback:** engine is isolated.  
**Do not invent:** LLM-based scheduling.  
**Source confidence:** high.  
**Evidence:** `pnpm test` output.

---

## PHASE 5 — Firecrawl integration

**Goal:** Scrape a URL to markdown + SHA-256 hash; store provenance.  
**Why:** Public portal watch is the trigger.  
**Dependencies:** Phases 2–3.  
**Read first:** [Firecrawl scrape](https://docs.firecrawl.dev/features/scrape); [API scrape](https://docs.firecrawl.dev/api-reference/v2-endpoint/scrape); [Monitor](https://docs.firecrawl.dev/features/monitor).  
**Resources:** `FIRECRAWL_API_KEY` (verified 200 this session).  
**Files:** CREATE `convex/model/firecrawl.ts`, `convex/watches.ts`. MODIFY Convex env.  
**Data model:** `permitSources` rows.  
**API:** internalAction `watches.fetchOne`; later cron `watches.sweep`.  
**Env:** `FIRECRAWL_API_KEY` on Convex (component env if using `@firecrawl/firecrawl-convex`; also outer env for REST fallback).  
**Browser:** none this phase.  
**Steps:** 1) Prefer official component `scrape` if env bind works; else REST `POST /v2/scrape` with Bearer. 2) `formats: ["markdown"]`, `maxAge: 0` on watch fetches. 3) Hash markdown. 4) If hash equals `permits.contentHash`, return `unchanged` and **do not** call OpenAI. 5) Track scrape count / last success / last error on permit or watch row.  
**Tests:** mock transport: unchanged short-circuit; 429 maps to retry; 5xx recorded, status not fabricated.  
**Failure:** timeout → last-known-status degraded UI.  
**Security:** never log API key; webhook later uses shared secret header.  
**Idempotency:** same URL+hash writes at most one new source.  
**Retry:** bounded 3 attempts with backoff in action; workflow for long paths.  
**Observability:** `activity` sponsor `firecrawl`.  
**Acceptance:** live scrape of `example.com` from an action in logs (then real portal in Phase 6).  
**Demo-visible:** source URL + fetched-at + hash on permit.  
**Rollback:** disable watchActive.  
**Do not invent:** scrape response fields.  
**Source confidence:** high (live 200).  
**Evidence:** Convex logs + stored source row.

---

## PHASE 6 — Permit portal normalization

**Goal:** One verified city: raw status string → semantic enum.  
**Why:** Downstream schedule keys off semantic status, not portal English.  
**Dependencies:** Phase 5.  
**Read first:** File 03 §2.2; Accela ACA / eTRAKiT public search.  
**Resources:** public Indianapolis Accela and/or Santa Cruz eTRAKiT (re-verify live).  
**Files:** CREATE `convex/normalize/status.ts`, `convex/cities.ts`, seed city row.  
**Data model:** `cities.statusVocabulary`.  
**API:** `normalizeStatus(city, raw) → semantic | unknown`.  
**Env:** none.  
**Browser:** open the real search page; capture one **real** permit number + status URL pattern.  
**Steps:** 1) Browser-verify portal still public. 2) Capture URL template with `{permitNumber}`. 3) Map observed raw strings: issued, in review, comments, failed, finaled, expired, unknown. 4) Unknown → do not auto-act. 5) Record `lastVerifiedAt`.  
**Tests:** fixture markdown from a captured scrape (labeled capture date).  
**Failure:** structure change → `sourceStale: true`, disable unsafe automation.  
**Security:** public records only.  
**Idempotency:** vocabulary upsert by raw string.  
**Retry:** n/a.  
**Observability:** unknown-status activity.  
**Acceptance:** one real permit fetches and normalizes.  
**Demo-visible:** “live city data” line.  
**Rollback:** freeze that permit.  
**Do not invent:** multi-city claims.  
**Source confidence:** medium until live capture (research high; must re-verify).  
**Evidence:** stored `permitSources.url`.

---

## PHASE 7 — OpenAI structured understanding layer

**Goal:** Three typed tasks: extractRequirements, parseTradeReply, draftChaseEmail.  
**Why:** Language in; verified structure out.  
**Dependencies:** Phase 3; OpenAI key (currently empty — seam still ships).  
**Read first:** [OpenAI API](https://platform.openai.com/); help articles on keys. Prefer `POST /v1/responses` or documented chat completions with `json_schema` — **verify the live endpoint at implement time**; do not assume a model id from research.  
**Resources:** `OPENAI_API_KEY` in Convex env when obtained.  
**Files:** CREATE `convex/model/ai/types.ts`, `openai.ts`, `extract.ts`, `replies.ts`, `draft.ts`, `validate.ts`.  
**Data model:** `requirements.quotedFromSource`, `decisions.engine`.  
**API:** internalActions only.  
**Env:** `OPENAI_API_KEY`.  
**Browser:** OpenAI dashboard if key still missing.  
**Steps:** 1) Narrow methods, not `askAI()`. 2) Strict JSON schema. 3) Quote gate: `source.includes(normalizedQuote)` else status `unverified`. 4) Timeout + 2 retries on 429/5xx. 5) Record model name from response, never guess.  
**Tests:** malformed JSON rejected; missing quote rejected; valid fixture applied.  
**Failure:** no key → engine `rules` / human review, never fake.  
**Security:** no secrets in prompts logs.  
**Idempotency:** fingerprint input; skip duplicate extracts.  
**Retry:** bounded.  
**Observability:** durationMs + engine.  
**Acceptance:** fixture letter → 3 requirements + 1 rejected invention.  
**Demo-visible:** highlighted quotes.  
**Rollback:** disable extracts.  
**Do not invent:** model capabilities.  
**Source confidence:** medium (key missing today).  
**Evidence:** decision rows with engine name.

---

## PHASE 8 — Temporary alternate AI provider seam

**Goal:** Same `AIProvider` interface; Gemini only if OpenAI is down.  
**Why:** Unblock language tasks; OpenAI remains primary.  
**Dependencies:** Phase 7.  
**Read first:** [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key).  
**Resources:** `GEMINI_API_KEY` optional.  
**Files:** CREATE `convex/model/ai/gemini.ts`, `provider.ts`.  
**Data model:** `decisions.engine = "gemini"` allowed.  
**API:** identical method names.  
**Env:** `GEMINI_API_KEY`, `AI_PROVIDER` = `openai` | `gemini` | `rules`.  
**Browser:** Google AI Studio if needed.  
**Steps:** 1) Try OpenAI first. 2) On 401/402/429/5xx after retries, optional Gemini. 3) Always validate schema + quotes. 4) Demo path prefers OpenAI when key works.  
**Tests:** mock OpenAI 503 → Gemini path; both fail → rules.  
**Failure:** neither key → deterministic keywords only.  
**Security:** same as Phase 7.  
**Idempotency / retry / observability:** same seam.  
**Acceptance:** unit test of fallback order.  
**Demo-visible:** provider status on `/judges`.  
**Rollback:** set `AI_PROVIDER=openai`.  
**Do not invent:** silent permanent swap.  
**Source confidence:** docs high; keys empty.  
**Evidence:** tests.

---

## PHASE 9 — AgentMail REST + inbound webhook + outbound mail

**Goal:** Send with Idempotency-Key; receive Svix-verified webhooks; dedupe.  
**Why:** Trades live in email.  
**Dependencies:** Phase 2 HTTP; usable API key (current key lacks `inbox_read` — fix in console first).  
**Read first:** [create inbox](https://docs.agentmail.to/api-reference/inboxes/create); [webhooks](https://docs.agentmail.to/webhooks-overview); [verification](https://docs.agentmail.to/webhook-verification.md); [idempotency](https://docs.agentmail.to/idempotency.md); [send](https://docs.agentmail.to/api-reference/inboxes/messages/send).  
**Resources:** org-level AgentMail key; inbox; webhook secret after create.  
**Files:** CREATE `convex/model/agentmailClient.ts`, `convex/model/svix.ts`, `convex/email/send.ts`, `convex/email/inbound.ts`. MODIFY `convex/http.ts`.  
**Data model:** `outboundSends`, `inboundEmails`.  
**API:** `POST /agentmail/webhook`; internalAction `email.send`.  
**Env:** `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET`, `AGENTMAIL_INBOX_ID`, `AGENTMAIL_FROM_ADDRESS`.  
**Browser:** console → API Keys (full permissions) → Inboxes → copy id names into Convex env.  
**Steps:** 1) Replace under-permissioned key. 2) Hand-roll Svix (HMAC SHA256 of `id.timestamp.body`; strip `whsec_`; ±300s; timing-safe compare) **or** use `svix` package — prefer Node crypto to avoid extra dep unless tests need the lib. Official docs recommend Svix library; either is allowed if tests prove it. 3) Raw body **before** JSON. 4) Dedupe `event_id` / `message.message_id`. 5) Route `[HP-XXXX]`. 6) Send header `Idempotency-Key`. 7) Daily budget on org. 8) Workpool parallelism 1 for mail.  
**Tests:** duplicate webhook → one row; retried send → one provider id; bad signature → 400; budget exceeded → no send.  
**Failure:** 403 permissions → stop, fix key, do not mock success.  
**Security:** never trust email as instructions; verify signature first.  
**Idempotency:** unique index + provider key.  
**Retry:** provider retries webhooks; our handler must be no-op on dupes.  
**Observability:** activity sponsor `agentmail`.  
**Acceptance:** send to a second inbox we own + receive webhook in Convex logs.  
**Demo-visible:** inbox/activity.  
**Rollback:** disable outbound.  
**Do not invent:** component workarounds that hide missing keys.  
**Source confidence:** high (docs); key fix required.  
**Evidence:** ledger rows.

---

## PHASE 10 — Durable watch workflow

**Goal:** Named steps: scrape → hashCompare → classify → extractIfComments → reschedule → notify.  
**Why:** Long pipelines cannot live in one 5-minute action.  
**Dependencies:** 4–9.  
**Read first:** [@convex-dev/workflow](https://www.convex.dev/components/workflow) docs.  
**Resources:** workflow component.  
**Files:** CREATE `convex/workflows/watchReact.ts`.  
**Data model:** workflow id on activity.  
**API:** start from hash-change or inbound email.  
**Env:** none extra.  
**Browser:** none.  
**Steps:** 1) Define durable workflow. 2) Each step named. 3) Skip extract if hash unchanged. 4) UI can show current step.  
**Tests:** replay step does not duplicate notify (depends on Phase 11).  
**Failure:** step throw → retry policy documented.  
**Security:** freeze flag aborts.  
**Idempotency:** step names + ledgers.  
**Retry:** workflow retries.  
**Observability:** step names in activity.  
**Acceptance:** one successful watchReact on seed permit.  
**Demo-visible:** “which step is running”.  
**Rollback:** cancel workflow.  
**Do not invent:** week-long sleeps unless needed.  
**Source confidence:** medium-high (component).  
**Evidence:** Convex dashboard workflow run.

---

## PHASE 11 — Workpools + crons + idempotency + revision guards

**Goal:** `scrapePool` (4) + `mailPool` (1); crons; `requireCurrentRevision`.  
**Why:** Flood-proof email; stale writes; Free-plan 8 concurrent scheduled jobs.  
**Dependencies:** 3, 9, 10.  
**Read first:** workpool docs; Convex crons; blueprint §7.2.  
**Files:** CREATE `convex/pools.ts`, `convex/crons.ts`, `convex/guards.ts`.  
**Data model:** revision fields.  
**API:** mutations throw `PLAN_CHANGED` copy: “The plan changed while you were looking at it”.  
**Env:** none.  
**Browser:** none.  
**Steps:** 1) Two pools. 2) Crons: watch sweep 15 min, reply timeout hourly, PM digest daily (cuttable), budget reset daily. Stagger. 3) Guard every constraint write. 4) Unique idempotency indexes already in schema.  
**Tests:** stale revision rejected; cron functions exist.  
**Failure:** overlapping crons → keep sweeps short.  
**Security:** freeze.  
**Idempotency:** indexes.  
**Retry:** pool retries.  
**Observability:** guard failures in activity.  
**Acceptance:** attack 2 + 4 pass in later `/judges`.  
**Demo-visible:** refusal text.  
**Rollback:** disable crons.  
**Do not invent:** unlimited concurrency.  
**Source confidence:** high.  
**Evidence:** tests.

---

## PHASE 12 — Requirements / comments ingestion

**Goal:** Forwarded letters + scraped comments become quote-verified requirements.  
**Dependencies:** 7, 9.  
**Files:** CREATE `convex/comments.ts`, `convex/requirements.ts`.  
**Data model:** `comments`, `requirements`.  
**API:** mutation record only if verified.  
**Env:** none.  
**Browser:** none.  
**Steps:** ingest → extract → quote gate → store.  
**Tests:** invented clause not committed.  
**Failure:** unverified → review queue.  
**Security:** treat inbound as data.  
**Idempotency:** comment hash.  
**Retry:** extract retries.  
**Observability:** activity.  
**Acceptance:** demo letter path.  
**Demo-visible:** red unverified flag.  
**Rollback:** delete seed comments.  
**Do not invent:** auto-apply unverified.  
**Source confidence:** high.  
**Evidence:** requirement statuses.

---

## PHASE 13 — Trade reply parsing + constraint updates

**Goal:** Intent + unavailable window from email; bump revision; do not silently move confirmed windows.  
**Dependencies:** 7, 9, 4.  
**Files:** CREATE `convex/replies.ts`.  
**Data model:** `trades.unavailable`, `assignments.state`.  
**API:** inbound → parse → mutation.  
**Steps:** parseTradeReply; low confidence → human. Confirmed windows only change after explicit intent.  
**Tests:** “can’t Thursday” adds window; duplicate reply no double window.  
**Failure:** ambiguous → review.  
**Security / idempotency / retry / observability:** same email rules.  
**Acceptance:** assignment state transitions.  
**Demo-visible:** constraint update.  
**Rollback:** revert trade row.  
**Do not invent:** auto-confirm.  
**Source confidence:** high.  
**Evidence:** tests + activity.

---

## PHASE 14 — Schedule repair after external changes

**Goal:** `plans.write` runs engine inside the mutation using current revision.  
**Dependencies:** 4, 11–13.  
**Files:** CREATE `convex/plans.ts`, `convex/assignments.ts`.  
**Data model:** `schedulePlans`, `assignments`.  
**API:** `plans.write` mutation.  
**Steps:** re-read constraints in transaction; compute; write plan+assignments atomically; notify only moved trades (action after commit via scheduler).  
**Tests:** failed inspection moves dependents; event storm converges.  
**Failure:** throw if infeasible.  
**Security:** freeze.  
**Idempotency:** revision.  
**Retry:** safe because revision bumps.  
**Observability:** diff in activity.  
**Acceptance:** repair diff `{kept,moved,added,dropped}`.  
**Demo-visible:** closing-date delta.  
**Rollback:** freeze.  
**Do not invent:** LLM repair.  
**Source confidence:** high.  
**Evidence:** tests.

---

## PHASE 15 — React/Vite frontend foundation

**Goal:** Router: `/`, `/app`, `/app/permits/:id`, `/judges`. Convex `ConvexProvider`.  
**Dependencies:** 2.  
**Read first:** react-router 7 docs; convex/react.  
**Files:** CREATE `src/main.tsx`, routes, `src/lib/convex.ts`.  
**Env:** `VITE_CONVEX_URL` only (public).  
**Browser:** local `pnpm dev`.  
**Steps:** layout shell; empty/loading/error states; keyboard focus.  
**Tests:** route render smoke.  
**Failure:** missing URL → explicit error screen.  
**Security:** no secret vite vars.  
**Acceptance:** navigable skeleton.  
**Demo-visible:** shell.  
**Rollback:** n/a.  
**Do not invent:** Next.js.  
**Source confidence:** high.  
**Evidence:** browser.

---

## PHASE 16 — Premium marketing / hero experience

**Goal:** Landing that communicates the watch loop, not a generic AI startup.  
**Dependencies:** 15.  
**Read first:** [AgentMail](https://www.agentmail.to/) and [Firecrawl](https://www.firecrawl.dev/) for hierarchy/motion **not clone**. UI Layouts MCP + React Bits MCP — inspect real tools/source before installing.  
**Files:** CREATE `src/pages/Landing.tsx`, hero visual `src/components/hero/*`.  
**Browser:** desktop + mobile; `prefers-reduced-motion`.  
**Steps:** 1) Search MCP for backgrounds/scroll fade. 2) Install public React Bits only. 3) Semantic hero: portal → change → requirement → repair → notify. 4) How it works, proof, CTA.  
**Tests:** landing loads.  
**Failure:** missing Pro license → free components only.  
**Security:** n/a.  
**Acceptance:** visual QA vs polish bar (not a clone).  
**Demo-visible:** first 8 seconds.  
**Rollback:** simplify motion.  
**Do not invent:** premium components.  
**Source confidence:** medium (design).  
**Evidence:** screenshots internally, not with secrets.

---

## PHASE 17 — Live operations dashboard

**Goal:** Overview: permits, watches, last change, health. Live `useQuery`.  
**Dependencies:** 3, 15.  
**Files:** CREATE dashboard pages/components.  
**API:** board query.  
**Browser:** two-tab live update.  
**Steps:** list permits; watchActive; degraded fetch-failed state.  
**Tests:** convex-test query.  
**Acceptance:** two-tab demo.  
**Demo-visible:** board.  
**Do not invent:** fake metrics.  
**Source confidence:** high.  
**Evidence:** browser.

---

## PHASE 18 — Permit detail / inspection / schedule views

**Goal:** Detail: status, DAG, assignments, source evidence.  
**Dependencies:** 14, 17.  
**Files:** CREATE detail/schedule/trades views.  
**Acceptance:** repair diff visible.  
**Demo-visible:** 1:15 repair beat.  
**Do not invent:** inspector contact automation.  
**Evidence:** browser.

---

## PHASE 19 — Activity / provenance / evidence timeline

**Goal:** Sponsor-attributed timeline; hashes; quotes.  
**Dependencies:** activity writes from earlier phases.  
**Files:** CREATE timeline component.  
**Acceptance:** every important transition has a row.  
**Demo-visible:** 2:05 evidence card.  
**Do not invent:** stats.  
**Evidence:** query results.

---

## PHASE 20 — Judge path `/judges`

**Goal:** Inspectable product + runnable attacks on throwaway workspace.  
**Dependencies:** 11, 14, 19.  
**Read first:** blueprint §9; hackathon skill [log-format](https://raw.githubusercontent.com/get-convex/convex-hackathon-skill/main/references/log-format.md).  
**Files:** CREATE `src/pages/Judges.tsx`, `convex/judges.ts`.  
**Steps:** summary, live URL, sponsor map, workflow, demo path, current permit/schedule, timeline, evidence, reliability tests, provider statuses, limitations. Attacks 1–4 mandatory.  
**Tests:** attack functions.  
**Acceptance:** nothing mocked in attacks.  
**Demo-visible:** 2:20.  
**Do not invent:** test counts.  
**Evidence:** button-run green/red from real rows.

---

## PHASE 21 — Real seed / demo data

**Goal:** One real public permit + labeled demo project (trades, DAG, sample letter).  
**Files:** CREATE `convex/seed.ts`.  
**Honesty:** city status = real; trades/replies = seeded, labeled.  
**Acceptance:** seed idempotent via client_id-like keys.  
**Do not invent:** city responses in seconds.  
**Evidence:** seed mutation.

---

## PHASE 22 — Automated test suite

**Goal:** Unit + convex-test + adversarial as listed in the directive.  
**Files:** `tests/**`, `vitest.config.ts`, `.github/workflows/ci.yml`.  
**Acceptance:** CI green on push. **No green until they pass.**  
**Evidence:** vitest + GH Actions.

---

## PHASE 23 — Browser E2E verification

**Goal:** Landing, app, permit, live update, judges, mobile, empty/error.  
**Resources:** chrome-devtools MCP / Playwright if added.  
**Acceptance:** checklist in RELIABILITY.md.  
**Do not invent:** “works” without a run.  
**Evidence:** MCP snapshots / playwright report.

---

## PHASE 24 — Adversarial / failure testing

**Goal:** Duplicate webhook, stale revision, malformed AI, timeout, 401/429, empty portal, impossible schedule.  
**Files:** `tests/adversarial/*`.  
**Acceptance:** each scenario recorded in `reliabilityProofs`.  
**Evidence:** table rows.

---

## PHASE 25 — Performance / reliability pass

**Goal:** Hash short-circuit proven; scrape budget; mail pool 1; reduced-motion.  
**Acceptance:** unchanged page → zero AI calls (test spy).  
**Evidence:** test + activity.

---

## PHASE 26 — Security / secrets audit

**Goal:** No keys in git, bundles, markdown, screenshots.  
**Steps:** `git grep` for prefixes; confirm `.gitignore`; GitHub secret scanning if available.  
**Files:** CREATE `SECURITY.md`.  
**Acceptance:** audit clean.  
**Evidence:** grep output (matches must be zero for live secrets).

---

## PHASE 27 — Deployment

**Goal:** Public `https://<name>.convex.site` without invite.  
**Read first:** hackathon hosting; static-hosting deploy command from current package README (verify at implement time; research cited `npx @convex-dev/static-hosting deploy`).  
**Steps:** 1) `npx convex deploy`. 2) Static hosting deploy. 3) Set Convex env names. 4) Register AgentMail + Firecrawl webhooks to `.convex.site` paths. 5) Do **not** submit Vercel URL as the judge URL.  
**Acceptance:** curl health + open in browser.  
**Evidence:** public URL.

---

## PHASE 28 — Production browser smoke

**Goal:** Real user flows on production URL.  
**Acceptance:** landing, board, judges, mobile, console errors empty of failures.  
**Evidence:** live snapshots.

---

## PHASE 29 — Hackathon build-log update

**Goal:** Honest `hackathon.md` per [skill](https://github.com/get-convex/convex-hackathon-skill).  
**Steps:** start/update from local evidence only; redact inboxes; no secrets.  
**Acceptance:** product sentence, live URL, sponsor table, real-vs-seed ledger, judge path, known issues.  
**Evidence:** file at repo root.

---

## PHASE 30 — Final submission readiness

**Goal:** Public repo, live convex.site, video ≤3 min (record if time), social tags (human), vibeapps submit (human if CAPTCHA).  
**Acceptance:** self-review checklist in user directive §39 all YES or explicitly limited.  
**Files:** CREATE `ARCHITECTURE.md`, `RELIABILITY.md`, `DEPLOYMENT.md` if not already.  
**Evidence:** this plan’s completion audit + live URL + GitHub.

---

## Cross-cutting architecture (all phases)

```
Firecrawl watch / cron sweep
        → permitSources + hash
        → semantic normalize (rules first)
        → watchReact workflow
        → OpenAI extract (if comments; quote gate)
        → plans.write (engine in mutation)
        → AgentMail notify (idempotent)
AgentMail webhook
        → svix verify raw body
        → inboundEmails unique
        → parse reply
        → constraint revision++
        → plans.write
        → notify only diffs
```

**Auth:** optional per Luma; prefer password + anonymous if time; guest judge workspace must open without invite.

**Portal strategy:** one proven city in v1. Store `lastVerifiedAt`. Never claim N cities.

**OpenAI vs Gemini:** OpenAI primary. Gemini emergency. Rules last. Never fake OpenAI.

**AgentMail:** REST default. Component rejected unless env declaration is re-proven in the published package.

---

## Plan review — missing dependencies

| Gap | Impact | Mitigation |
|---|---|---|
| `OPENAI_API_KEY` empty | No real extraction in demo | Obtain key; until then rules + labeled limitation on `/judges` |
| `GEMINI_API_KEY` empty | No language fallback | Same |
| AgentMail key permissions | Cannot list/send | Create org key in logged-in console |
| `AGENTMAIL_WEBHOOK_SECRET` empty | Cannot verify inbound | Create webhook after Convex HTTP URL |
| Discovery prompt files missing | No extra constraints | Use 01–04 + this directive |
| Local git missing | Cannot push | `git init` in Phase 1 |
| Static-hosting docs URL 404 this session | Deploy command must be read from npm README | Verify at Phase 2/27 |
| Second city unverified | Scope honesty | One city only |

These gaps do **not** block Phases 1–4, 11 (guards), 15 (shell), or engine tests.

---

## Status

| Phase | Status |
|---|---|
| 0 | complete (this session) |
| 1–30 | next, in listed order |

After this file is saved, implementation starts at Phase 1 automatically.
