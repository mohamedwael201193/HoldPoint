# Reliability

Proofs are stored in `reliabilityProofs` by `reliability.runSuite`. The `/judges` page reads that table. Counts are not decorated.

## Attacks covered by the suite

| Attack | Expected |
|---|---|
| Stale revision | `requireCurrentRevision` throws |
| Unverified requirement | invented quote is not treated as present |
| Unchanged source hash | equality short-circuit |
| Duplicate webhook identity | same `message_id` |
| Duplicate inbound insert | one row for `proof-dup` |

## Runtime guards (not just the suite)

- Plan writes bump `constraintRevision`; UI must pass the revision it read.
- Frozen permits cannot be written.
- Unchanged Firecrawl hash skips language spend.
- Quotes shorter than 8 characters never verify.
- Trade unavailability without `YYYY-MM-DD to YYYY-MM-DD` is held for review.
- Outbound notify skips when the idempotency key already has `status: sent`.
- Daily send budget blocks further `sent` rows.
- Seeded `@example.invalid` addresses are never handed to AgentMail.
- Webhook handler returns 401 on bad Svix signatures and 503 if the secret is missing.

## What is still honest-degraded

- If OpenAI and Gemini keys are absent, extract/draft use the rules engine and `health.providers.primaryLanguage` reports `rules`.
- If AgentMail inbox id is missing, notify records `failed` with that reason.
- Portal fetch failure does not invent a new status.
