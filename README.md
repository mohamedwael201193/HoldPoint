<<<<<<< HEAD
# HoldPoint

The standing watch for construction permits and inspections.

Cities post permit status without notifying the general contractor. HoldPoint watches those public pages, detects real changes, normalizes portal language, recomputes a dependency-aware inspection schedule in deterministic code, and coordinates trades over ordinary email.

AI understands reviewer comments and replies. Deterministic code decides dates, dependencies, and whether a write is safe.

## Live

- App: https://kindhearted-cheetah-121.convex.site
- Judges: https://kindhearted-cheetah-121.convex.site/judges
- Health: https://kindhearted-cheetah-121.convex.site/health
- Repo: https://github.com/mohamedwael201193/HoldPoint

## Stack

- React, Vite, TypeScript
- Convex (database, live queries, workflows, crons, workpools, HTTP actions, static hosting)
- Firecrawl (public permit fetch)
- OpenAI (structured language understanding) with Gemini as emergency fallback and a rules engine if both are absent
- AgentMail REST + Svix webhooks

## Local

```bash
pnpm install
pnpm test
pnpm exec convex dev
pnpm dev
```

Copy `.env.example` to `.env`. Never commit `.env`.

## Honesty

The first portal is Accela public search (Indianapolis). Trades in the demo workspace use labeled invalid inboxes so the product never emails strangers. `/judges` does not invent metrics.
=======
# HoldPoint
>>>>>>> b4f0b13c0eed4d995db10d29bef3fa45f1b59a41
