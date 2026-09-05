# Verified Lead Brief — Monid “We Kill”

A narrow, live replacement for one Apollo prospect-research workflow:

**person + company → work email → deliverability check → company firmographics → one costed brief**

The demo does not claim to replace Apollo's CRM, sequencing, dialer, or full database. It kills one human-sold enrichment/research job that an agent can perform on demand.

## Target price reference

Apollo Organization is publicly listed at **$119/user/month billed annually with a 3-user minimum**, i.e. **$4,284/year minimum**. The app shows this only as the incumbent subscription reference; the actual Monid run cost is taken from each live run result.

Price source: https://www.apollo.io/pricing

## Live workflow

1. `apollo /people/match` — match a known person at a company domain.
2. Extract a returned work email; never invent one.
3. `api.strale.io /x402/email-validate` — verify deliverability of the actual returned email.
4. `pdl /v5/company/enrich` — company firmographics from the domain, with `min_likelihood: 4`.
5. Return a single JSON/UI brief with evidence, provider status, latency and actual per-run cost.

These endpoint/input shapes are documented by Monid, but **preflight inspection remains required before the paid demo** because schema, health and price can change.

## Setup

```bash
npm install -g @monid-ai/cli@latest
monid setup --client codex
monid keys add -k <your-key> -l main
npm run monid:doctor
npm run monid:preflight
npm test
npm start
```

`npm run monid:preflight` performs free `inspect` calls for all three live endpoints. Review the current schemas/prices/health before clicking the paid demo.

No outreach is sent by this project. A verified email is data quality evidence, not permission to spam.
