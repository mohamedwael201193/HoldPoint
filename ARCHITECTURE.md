# Architecture

HoldPoint watches public construction-permit pages, normalizes status, and repairs a dependency-aware inspection schedule in deterministic code. Language models only extract or draft. They never own dates, DAG order, retries, or writes.

## Runtime shape

- **Frontend:** React 19 + Vite 7 + TypeScript, hosted on the Convex deployment via `@convex-dev/static-hosting`.
- **Backend:** Convex 1.46 — queries, mutations, actions, HTTP actions, crons, `@convex-dev/workflow`, two `@convex-dev/workpool`s (`scrapePool`, `mailPool`).
- **Public source:** `@firecrawl/firecrawl-convex` scrape with `maxAge: 0`. Hash comparison short-circuits unchanged pages.
- **Mail:** AgentMail REST `POST /v0/inboxes/{inbox_id}/messages` ([send docs](https://docs.agentmail.to/api-reference/inboxes/messages/send)). Inbound `POST /webhooks/agentmail` verifies Svix headers on the raw body ([verification](https://docs.agentmail.to/webhook-verification)).
- **Language:** OpenAI Chat Completions JSON first; Gemini generateContent if OpenAI is unset/failing; rules fallback always available.

## Decision boundary

| Concern | Owner |
|---|---|
| Status vocabulary | `convex/engine/normalize.ts` |
| Inspection DAG / schedule / critical path | `convex/engine/schedule.ts` |
| Repair diff / who to notify | `convex/engine/repair.ts` |
| Quote gate | `convex/engine/quotes.ts` |
| Trade calendar mutation | `convex/engine/intent.ts` (ISO dates only) |
| Revision writes | `convex/guards.ts` + `plans.write` |
| Email idempotency | `outboundSends.byIdempotencyKey` |
| Inbound dedupe | `inboundEmails.byProviderMessageId` |

## Watch loop

1. Cron every 15 minutes enqueues `watches.fetchOneInternal` on `scrapePool`.
2. Firecrawl scrapes the stored public URL.
3. SHA-256 of markdown compared to `permits.contentHash`.
4. Unchanged: activity `watch_unchanged`, no language call.
5. Changed: snapshot + normalized status; `plans.writeFromWatch` inside a mutation; mail pool notifies only trades in the repair diff.
6. Fetch errors store `lastScrapeError` and keep the last verified status.

## Mail loop

AgentMail → raw body → Svix verify → `mail.processInbound` → routing token `[HP-…]` → quote-checked intent → optional unavailable window → schedule repair.

Demo inject (`mail.simulateInbound`) uses the same ingest path and is labeled as such.

## Sources

- Convex HTTP actions: https://docs.convex.dev/functions/http-actions
- Firecrawl Convex component scrape: package `@firecrawl/firecrawl-convex` 0.1.1
- Hackathon hosting: `*.convex.site` via static hosting 0.2.1
