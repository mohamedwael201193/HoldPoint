# Security

## Secrets

Runtime secrets live in Convex environment variables and a gitignored local `.env`. They are never written to markdown, `/judges`, screenshots, or source.

Names only (see `.env.example`):

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `FIRECRAWL_API_KEY`
- `FIRECRAWL_WEBHOOK_SECRET`
- `AGENTMAIL_API_KEY`
- `AGENTMAIL_WEBHOOK_SECRET`
- `AGENTMAIL_INBOX_ID`
- `AGENTMAIL_FROM_ADDRESS`

Frontend may only see `VITE_CONVEX_URL` (public Convex cloud URL).

GitHub and Vercel tokens, if present on a developer machine, stay in local credential stores. They are not Convex env vars and must not be committed.

## Git ignore

`.gitignore` excludes `.env`, `.env.*`, and `*.local`, with an exception for `.env.example`.

## Webhooks

`POST /webhooks/agentmail` reads the raw body, then verifies `svix-id` / `svix-timestamp` / `svix-signature` before JSON parse. Unsigned traffic is rejected.

## Model boundary

Model output cannot write inspection dates or apply a requirement whose quote is absent from the source document.

## Public demo

The hackathon app is reachable without an invite. The demo workspace is therefore unauthenticated. Destructive production auth is out of scope for this deployment; do not put private jobs in it.
