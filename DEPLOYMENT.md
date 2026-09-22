# Deployment

## Required public URL

Hackathon apps must be reachable without an invite at a supported hosted URL. HoldPoint uses Convex static hosting on `https://<deployment>.convex.site`.

Sources:

- https://www.convex.dev/hackathons/all-gas
- https://docs.convex.dev/
- https://www.npmjs.com/package/@convex-dev/static-hosting

## Commands

```bash
pnpm test
pnpm exec convex dev --once
pnpm deploy
```

`pnpm deploy` runs `npx @convex-dev/static-hosting deploy`, which builds the Vite app with `VITE_CONVEX_URL` injected and uploads the `dist` tree.

## HTTP layout

App routes in `convex/http.ts` stay at the root (`/health`, `/webhooks/agentmail`) so webhook URLs do not move. Static files are registered afterward with `registerStaticRoutes` ([compatibility mode](https://www.npmjs.com/package/@convex-dev/static-hosting)).

Firecrawl component HTTP is mounted at `/firecrawl/`.

## Convex env

Set on the deployment (dashboard or `npx convex env set`). Never pass GitHub/Vercel tokens here.

This project's production deployment: `kindhearted-cheetah-121`.

Dashboard: https://dashboard.convex.dev/t/mohamedwael2001193/holdpoint/kindhearted-cheetah-121

Public site: https://kindhearted-cheetah-121.convex.site

## Vercel

Not used as the judge URL. A Vercel project is optional and must not replace `convex.site`.
