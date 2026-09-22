# PROJECT_BASELINE

**Product:** HoldPoint — the standing watch for construction permits and inspections.  
**Date:** 2026-09-22  
**Status:** research locked; env names stored; no application scaffold yet.

This file records the repository and environment as inspected **before** application implementation. Secret values are never listed.

---

## Current status

HoldPoint is a research-only working tree plus leftover MCP bootstrap files. There is no Vite app, no Convex project, no tests, no `hackathon.md`, and no local Git repository.

The public GitHub remote exists and is empty of product code (README stub on `main`).

| Item | State |
|---|---|
| Local Git | **None** (no `.git`) |
| GitHub | Public `https://github.com/mohamedwael201193/HoldPoint` — `private=false`, default branch `main` |
| App shell | **Absent** (no `src/`, no `index.html`, no Vite config) |
| Convex | **Not initialized** |
| Tests | **Absent** |
| Deployment | **Not deployed** (`convex.site` required by hackathon rules) |
| Auth | **Absent** |
| `hackathon.md` | **Absent** |

---

## Detected stack (today)

| Layer | Detected | Notes |
|---|---|---|
| Node | v24.12.0 | Matches research recommendation (`engines.node >= 24`) |
| npm | 11.6.2 | Present |
| pnpm | 10.34.5 | Present — preferred package manager |
| TypeScript / Vite / React | Not installed as an app | Only `shadcn` CLI leftover |
| Convex CLI | Not in this repo | Must be added |
| Tailwind | Not present | `components.json` anticipates `src/index.css` |
| Next.js | Not present | Must stay unused |

`package.json` currently contains only `shadcn` as a devDependency and a `@react-bits` registry pointer. That is MCP bootstrap, not the product.

---

## Existing files (product-relevant)

Kept and treated as source research / tooling, not product UI:

- `01_ALL_GAS_OFFICIAL_AND_STACK_FORENSICS.md` — hackathon rules, sponsor surfaces, Convex/Firecrawl/AgentMail/OpenAI forensics
- `02_PARALLEL_AND_COMPETITOR_FORENSICS.md` — **private engineering research only**. Implementation files must never name that competitor or copy its code.
- `03_MARKET_WHITESPACE_AND_IDEA_LAB.md` — market evidence; HoldPoint selected
- `04_FINAL_PRODUCT_BLUEPRINT.md` — schema, loop, demo, reliability contract
- `.cursor/mcp.json` — project shadcn MCP
- `components.json` — `@react-bits` registry
- `.gitignore` — now excludes `.env` / `.env.*` except `.env.example`
- `.env` — gitignored secrets (created this session)
- `.env.example` — names only
- `package.json` / `package-lock.json` / `node_modules/` — shadcn CLI only

**Not found in this workspace:**

- `ALL_GAS_PRODUCT_DISCOVERY_MASTER_PROMPT_V3.md`
- `ALL_GAS_PRODUCT_DISCOVERY_MASTER_PROMPT_V3.txt`

The four research files plus the user directive are treated as the product contract. Discovery-prompt files will be used if they appear later; they are not required to start.

---

## Current dependencies

```json
{
  "devDependencies": { "shadcn": "^4.21.0" },
  "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" }
}
```

No Convex, React, Vite, Tailwind, Vitest, workflow, workpool, or static-hosting packages.

---

## Current deployment state

- No Convex deployment URL
- No `convex.json`
- No `@convex-dev/static-hosting` config
- Vercel token present in local env only — **not** the hackathon-required host
- Required live URL form (official, 2026-09-22): `*.convex.site` or `*.chatgpt.site`
- Decision: **`convex.site` via static hosting component** (any-IDE path; no ChatGPT desktop dependency)

---

## Environment variable NAMES (values omitted)

Present in gitignored `.env` (set vs empty):

| Name | Set? | Validation this session |
|---|---|---|
| `AGENTMAIL_API_KEY` | yes | HTTP 403 on org inbox list: key lacks `inbox_read` (inbox-scoped / under-permissioned). Console is logged in; org-level key must be created in dashboard before send/list works. |
| `FIRECRAWL_API_KEY` | yes | `POST https://api.firecrawl.dev/v2/scrape` → **200**. MCP credit usage: **1024 remaining** this billing period. |
| `FIRECRAWL_WEBHOOK_SECRET` | yes | Stored; not yet bound to a live monitor (no Convex HTTP URL yet). Monitor webhooks accept custom `Authorization` headers ([Firecrawl monitor docs](https://docs.firecrawl.dev/features/monitor)). |
| `VERCEL_TOKEN` | yes | `GET /v2/user` → 200. **Do not commit. Not the required public host.** |
| `GITHUB_TOKEN` | yes | `GET /user` and repo lookup → 200. **Do not commit. Deploy/git credential only.** |
| `GITHUB_REPO` | yes (URL, not a secret) | Public repo confirmed |
| `OPENAI_API_KEY` | **empty** | Blocked until dashboard/key created |
| `GEMINI_API_KEY` | **empty** | Emergency fallback only; also empty |
| `AGENTMAIL_WEBHOOK_SECRET` | **empty** | Created only after HTTP route exists; Svix secret starts `whsec_` ([AgentMail verifying webhooks](https://docs.agentmail.to/webhook-verification.md)) |
| `AGENTMAIL_INBOX_ID` | **empty** | Must be captured from console after a usable key |
| `AGENTMAIL_FROM_ADDRESS` | **empty** | Same |
| `VITE_CONVEX_URL` | **empty** | Convex cloud URL after `npx convex dev/deploy` |
| `APP_PUBLIC_URL` | **empty** | Final `*.convex.site` URL |

`.env.example` lists **application** names only (no GitHub/Vercel tokens).

---

## Missing integrations

1. Convex backend + schema + static hosting
2. Firecrawl scrape + hash-gated watch (REST and/or official component)
3. OpenAI structured understanding (primary)
4. Gemini provider seam (dev fallback only)
5. AgentMail REST send + Svix-verified inbound webhook
6. Deterministic inspection scheduler
7. React + Vite frontend, dashboard, `/judges`
8. Tests, CI, `hackathon.md`

## Broken / blocked integrations

| Integration | Issue | Next fix |
|---|---|---|
| AgentMail | Provided key cannot list inboxes (`missing_permission: inbox_read`). Screenshot inbox identifier did not match this credential. | Create an org/pod key with send + webhook + inbox read in the logged-in console; store in Convex env, not git. |
| OpenAI | Key missing | Obtain from platform while logged in; never commit. Until then: schema-validated provider seam with deterministic rules fallback (product must still schedule). |
| Gemini | Key missing | Same; optional unblock for language tasks only |
| Firecrawl Monitor webhook | Secret stored, no public Convex HTTP URL yet | Register monitor **after** `https://<deployment>.convex.site/firecrawl/monitor` exists. Until then, 15-min Convex cron sweep is the watch. |
| Git local | No `.git` | `git init` after first real files; history must start ≥ 2026-08-25 12:00 PT |

## Reusable work

- Research files 01–04 (complete, 2026-09-22)
- `@react-bits` registry already in `components.json`
- shadcn MCP server configured globally and in `.cursor/mcp.json`
- Firecrawl MCP connected and credits confirmed
- AgentMail console session (webhooks UI + Svix portal)
- Public GitHub repo already created

## Risky areas

1. **Deadline:** submissions close **2026-09-22 12:00 PM PT**. Spine first.
2. **Hosting rule:** Vercel/Netlify/github.io **disqualify**. Only `convex.site` / `chatgpt.site`.
3. **AgentMail Convex component env bug** (research: component sandbox has empty env). Default: **REST + hand-rolled Svix**. Do not mount `@agentmail/convex` unless re-verified working.
4. **AI credits:** no OpenAI credits from the hackathon. Empty key today. Never fake OpenAI.
5. **Portal diversity:** claim **one verified city** until a second is proven.
6. **Secrets:** GitHub/Vercel tokens and provider keys must never enter git, `hackathon.md`, screenshots, or frontend `VITE_*` vars.
7. **Research vs implementation:** historical third-party decision-model notes stay in research files only. Implementation is **no** such provider.

---

## Extracted product lock (from research, condensed)

- **User:** GC PM / superintendent; secondary expediter firms
- **Trigger:** standing Firecrawl watch on public permit pages (not a user paste)
- **Two event streams:** portal hash-change + inbound email
- **Convex:** scheduler **inside** the plan-write mutation; revision guards; workpools; crons; HTTP actions; live queries
- **OpenAI:** extract / parse / draft only; quote-verified; never date math or DAG logic
- **AgentMail:** one shared inbox; `[HP-XXXX]` routing; `Idempotency-Key` on sends; unique `providerMessageId` inbound
- **Hosting:** `convex.site`
- **Judge path:** `/judges` with live attacks, honesty ledger
- **First portal:** Accela ACA / eTRAKiT public status (research verified Indianapolis Accela and Santa Cruz eTRAKiT as login-free). Re-verify at build time; do not invent endpoints.

---

## MCP / skills / browser (this session)

**MCP namespaces observed:** `user-firecrawl` (ready; scrape + credits), `user-shadcn` (ready; React Bits registry), `user-ui-layouts-mcp`, `user-chrome-devtools` (AgentMail console open), plus existing user MCPs unused for this product.

**Skills:** Convex hackathon skill fetched from [official SKILL.md](https://raw.githubusercontent.com/get-convex/convex-hackathon-skill/main/SKILL.md). Local copy not yet installed in this repo; `hackathon.md` will follow that format.

**Browser tabs relevant:** AgentMail console (logged in), Firecrawl marketing, GitHub HoldPoint, Luma hackathon, vibeapps.dev. No OpenAI platform tab open.

---

## Official sources re-checked this session

| Source | Result |
|---|---|
| [All Gas hackathon](https://www.convex.dev/hackathons/all-gas) | Live; prizes/criteria match research |
| [Firecrawl Monitor](https://docs.firecrawl.dev/features/monitor) | Current: `/v2/monitor`, scrape/crawl/search targets, webhook + custom headers, 10s ack, 3 retries |
| [Firecrawl scrape](https://docs.firecrawl.dev/features/scrape) | `POST /v2/scrape` with `Authorization: Bearer` — **verified 200** |
| [AgentMail webhooks](https://docs.agentmail.to/webhooks-overview) | Svix; `message.received`; raw body; 1 MB cap |
| [AgentMail verification](https://docs.agentmail.to/webhook-verification.md) | Headers `svix-id`, `svix-timestamp`, `svix-signature`; secret `whsec_`; ±5 min |
| [AgentMail idempotency](https://docs.agentmail.to/idempotency.md) | `Idempotency-Key` on send; 24h; 409 on key+body mismatch |
| [AgentMail create inbox](https://docs.agentmail.to/api-reference/inboxes/create) | `POST /v0/inboxes` |
| [Convex HTTP actions](https://docs.convex.dev/functions/http-actions) | Raw `Request`; exposed on `*.convex.site`; 20 MiB |

---

## Exact recommended next step

1. Finish `IMPLEMENTATION_PLAN.md` (this session).
2. Bootstrap React + Vite + TypeScript + Tailwind + Convex in this folder **without Next.js**.
3. Init Git; keep `.env` untracked; connect public GitHub remote.
4. Implement schema + deterministic engine + tests (spine).
5. Add Firecrawl watch (cron sweep first; monitor webhook when site URL exists).
6. Add OpenAI/Gemini seam when keys exist; rules fallback always.
7. Fix AgentMail credentials via console, then REST + webhook.
8. Frontend, `/judges`, deploy to `convex.site`, write `hackathon.md`.

Do not implement a fake permit API. Do not mount the AgentMail Convex component by default. Do not put secrets in git.
