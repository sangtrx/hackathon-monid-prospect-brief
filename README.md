# RxCheck Pocket

**Offline-first medication-safety decision support for low-connectivity frontline settings.**

RxCheck Pocket is a deliberately bounded entry for Hack-Nation 7, World Bank Small AI for Development, Health track. It checks a short medication list against a compact local rule set, prioritizes high-risk findings, keeps every curated interaction traceable to a public source, and fails closed when a medicine name is not confirmed.

The core path runs entirely in the browser after the first load. No API key, backend, LLM, patient record or continuous internet connection is required.

## Why this fits Small AI

This project does not try to be a general medical chatbot. It trades breadth for a narrow, auditable workflow that remains available on ordinary devices when connectivity is unreliable.

- **Targeted task:** medication-list risk screening and reconciliation prompts.
- **Accessible runtime:** static PWA, installable from a browser.
- **Offline path:** rules, aliases and UI are cached locally.
- **Fail-closed behavior:** unknown names are never silently corrected.
- **Human authority:** the app flags risk; a clinician or pharmacist decides what to do.
- **Data minimization:** no patient data is required or stored by the demo.

## What it checks

The bundled demo covers a small set of label-supported interaction patterns:

- sildenafil plus organic nitrates
- clarithromycin plus simvastatin or lovastatin
- clarithromycin plus warfarin
- sertraline plus warfarin, aspirin, ibuprofen or naproxen
- sertraline plus pimozide
- sertraline plus an MAOI example, phenelzine
- duplicate active ingredient after brand/generic alias resolution
- NSAID or statin therapeutic-class duplication as a reconciliation prompt

This is intentionally **not** a complete drug-interaction database.

## Safety boundary

RxCheck Pocket is a hackathon prototype for decision support. It does not diagnose, prescribe, recommend doses, recommend treatment changes, or claim that a pair is safe when no rule is found.

A **REVIEW** result that says “No curated rule matched” means only that the bounded demo dataset has no matching rule. It must not be interpreted as clinical clearance.

Archived FDA labels are used as public provenance for several demo rules. Production use would require validated, current labeling and a governed clinical knowledge process.

## Public-source provenance

| Rule family | Public source |
| --- | --- |
| Sildenafil + nitrates | [FDA VIAGRA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/020895s045lbl.pdf) |
| Clarithromycin + warfarin/statins | [FDA BIAXIN label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/050698s031lbl.pdf) |
| Sertraline contraindications and bleeding risk | [FDA ZOLOFT label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/019839S74S86S87_20990S35S44S45lbl.pdf) |
| NSAID class reconciliation | [FDA NSAID safety information](https://www.fda.gov/drugs/drug-safety-and-availability/fda-recommends-avoiding-use-nsaids-pregnancy-20-weeks-or-later-because-they-can-result-low-amniotic) |
| Statin class reconciliation | [FDA Cholesterol Medicines Guide](https://www.fda.gov/consumers/womens-health-topics/cholesterol-medicines-guide) |

Retrieval/review date for this hackathon prototype: **2026-10-04**.

## Architecture

    medication names
          |
          v
    local normalization + explicit alias map
          |
          +--> unknown/typo -> UNKNOWN + confirmation prompt
          |
          v
    deterministic pair rules + class reconciliation
          |
          v
    severity ordering: RED > AMBER > REVIEW > UNKNOWN
          |
          v
    short explanation + action + source provenance

The service worker caches the UI plus the rule engine. After the first successful load, the core checker does not require the network.

## Run locally

Requires Node.js 22 or newer.

    npm test
    npm run evaluate
    npm run build
    npm start

Open http://127.0.0.1:4173.

## Evaluation

npm run evaluate runs a fixed set of synthetic/publicly-derived regression fixtures and a local micro-benchmark. The evaluation checks deterministic agreement with the expected behavior of this bundled rule set only.

**Do not interpret fixture agreement as clinical sensitivity, specificity, safety validation or real-world performance.**

## Deploy

The repository includes vercel.json. Run npm run build and deploy the generated dist directory using Vercel or any static HTTPS host.

HTTPS is required for normal service-worker behavior outside localhost.

## Demo cases

- sildenafil, nitroglycerin
- clarithromycin, warfarin
- sertraline, ibuprofen
- ibuprofen, naproxen
- warfarin, Coumadin
- sildnafil, nitroglycerin
- sildenafil, warfarin
- sertraline, pimozide

## Limitations

- Tiny curated scope built for a 24-hour challenge.
- No dose, route, timing, age, pregnancy, organ function, indication or laboratory context.
- No full interaction ontology.
- No current-label synchronization.
- Typo suggestions are string-distance hints only and require explicit human confirmation.
- Browser offline cache must be installed by one successful initial load.
- Clinical deployment would require current governed data, formal validation, security/privacy review, quality management and local regulatory assessment.

## Submission assets

See [docs/SUBMISSION.md](docs/SUBMISSION.md).

## License

MIT for the software. Linked FDA source material remains subject to its source terms.
