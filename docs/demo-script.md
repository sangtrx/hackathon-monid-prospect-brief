# 90-second judge demo

Target: 70–90 seconds. One continuous click-through. No architecture lecture before the product works.

## 0–10s — price + kill

Show the hero and say:

> Apollo Organization starts at a public three-seat minimum of $4,284 a year. I am not claiming to replace Apollo. I am replacing one narrow job: take a known person and company and return a verified, company-enriched lead on demand.

## 10–20s — free safety preflight

Briefly show terminal output from:

```bash
npm run monid:preflight
```

Point out current schema/health/pricing for:

- Apollo `/people/match`
- Strale `/x402/email-validate`
- PDL `/v5/company/enrich`

Do not linger. The point is that the app inspects before spending.

## 20–50s — live run

Use a real, non-sensitive public test person/company where the providers are expected to have business data. Enter name + company domain and click **Build verified lead brief**.

Narrate only what happens:

1. Apollo matches the person at the domain.
2. If Apollo returns a work email, that exact value is passed to Strale; the app never guesses an address.
3. PDL enriches the company in parallel.

## 50–70s — evidence + receipts

Show:

- returned work email
- deliverability state
- company firmographics
- each provider's status / latency / actual Monid cost
- total cost for this one live run

Say explicitly that per-run cost is **not annualized** because usage volume determines annual spend.

## 70–85s — failure behavior

Show or mention the tested contract:

- no email → no fabricated address and no Strale call
- one provider fails → useful partial result remains
- bad input → explicit error

## 85–90s — close

> One key, three live tools, one auditable prospect-research job — paid only when the agent needs it.

## Recording checklist

- [ ] Actual live run, not fixture/mock data
- [ ] Current public Apollo pricing visible
- [ ] Current Monid preflight/prices visible
- [ ] Total actual cost visible after completion
- [ ] Browser zoom large enough to read receipts
- [ ] No API key/secret visible in terminal or browser
- [ ] No personal/private contact data used without permission
