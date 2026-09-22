# HoldPoint — All Gas build log

## 2026-09-22 — product spine

Built HoldPoint as a standing watch for construction permits and inspections.

- React + Vite + TypeScript frontend (no Next.js)
- Convex schema, deterministic scheduler, Firecrawl scrape + hash short-circuit
- OpenAI/Gemini/rules language seam with quote verification
- AgentMail REST send + Svix-verified inbound webhook
- `/judges` reads live Convex state
- Static hosting: `https://kindhearted-cheetah-121.convex.site`

Language models do not choose inspection dates. Unchanged public pages do not call a model.

Demo data: Indianapolis Accela public search URL is real; permit number, trades, and reviewer excerpt are labeled demo.

## 2026-09-22 — live mailbox and language fallback

Verified on production `kindhearted-cheetah-121`:

- Firecrawl fetched the Indianapolis Accela search page.
- Watch fingerprint hashes status-bearing lines so Accela viewstate noise does not spend language.
- OpenAI key is still absent. Gemini emergency fallback extracted three quote-verified requirements (`engine: gemini`).
- AgentMail inbox, org key, and webhook are configured. A loopback send returned an SES `message_id`. Seeded `@example.invalid` trades stay `skipped_demo`.
- Reliability suite 5/5 on this deployment.
