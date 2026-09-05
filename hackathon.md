# Monid “We Kill” — build log

Entry: **Verified Lead Brief**

## Kill scope

Replace one paid Apollo-style prospect enrichment/research workflow:

`known person + company → work email → deliverability → company firmographics → agent-ready brief`

This entry does **not** claim to replace Apollo's full CRM, sequencing, dialer, engagement, or database product.

## Public incumbent price

Apollo Organization is publicly listed at $119/user/month billed annually with a 3-user minimum: $4,284/year minimum.

Source: https://www.apollo.io/pricing

## Monid runtime

- `apollo /people/match` — known person + company domain
- `api.strale.io /x402/email-validate` — validate only the email actually returned by the match
- `pdl /v5/company/enrich` — firmographics from domain with `min_likelihood: 4`

Before any paid demo, run `npm run monid:preflight` to inspect the current schemas, health and pricing for all three endpoints.

## Reliability rules

- Never fabricate a work email when a provider returns none.
- Preserve useful partial results when one provider fails.
- Report actual cost/status/latency from Monid runs.
- No outreach or auto-send behavior; deliverability does not imply consent.
- Bad input and provider errors are user-visible.

## Validation

2026-09-06: dependency-free Node test suite passed **8/8** after the dedicated chained workflow was added.

Live Monid acceptance is pending account API-key provisioning + free preflight + one small paid end-to-end run.

## Submission still pending

- live deployed URL
- <90 second demo
- five social posts (X, LinkedIn, Instagram, TikTok, YouTube)
- final hackathon submission
