# Prospect Brief — Monid “We Kill” MVP

A narrow, judge-friendly replacement for one paid prospect/company research workflow: enter a company/person, run **inspected live Monid endpoints**, normalize the evidence, and show the exact run cost and latency next to the incumbent SaaS price.

## Why this shape

- No guessed Monid schemas. Endpoints live in `config/endpoints.local.json`, created only after `discover -> inspect`.
- Cost is first-class. Every call records provider, endpoint, status, cost and latency.
- Failures are visible. Bad input, no results, partial results and provider errors do not turn into fake facts.
- The UI explicitly says what this replaces and what it does not.

## Setup

1. Install the current Monid CLI: `npm install -g @monid-ai/cli@latest`
2. Run `monid setup --client codex`.
3. Add a key locally with `monid keys add -k <key> -l main` and verify with `monid keys list`.
4. Discover candidates: `npm run monid:discover -- "company enrichment"` and `npm run monid:discover -- "linkedin person profile"`.
5. Inspect exact candidates: `npm run monid:inspect -- <provider> <endpoint>`.
6. Copy `config/endpoints.example.json` to `config/endpoints.local.json` and fill only the inspected provider/endpoint plus the exact input template required by that schema.
7. `npm test && npm start`.

The server intentionally refuses to call endpoints while the local config still contains placeholders.
