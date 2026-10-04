# RxCheck Pocket Submission Pack

## Project name

**RxCheck Pocket**

## Challenge

World Bank Small AI for Development, Health.

## One-line pitch

RxCheck Pocket is an offline-first medication-safety checker that helps frontline health workers spot a bounded set of high-risk medication combinations and reconciliation issues even when connectivity disappears.

## Short description

Cloud-first clinical assistants are fragile where bandwidth, latency and device capability are constrained. RxCheck Pocket takes the opposite approach: a small, deterministic medication-safety workflow whose core capability lives on the device.

A health worker enters two to six medicine names. The app resolves only explicit known aliases, refuses silent autocorrection, checks a compact set of public-source rules locally, sorts findings by severity, and shows exactly where each clinical claim came from. Unknown names stay unknown. No-match results explicitly say that the bounded dataset is not a safety clearance.

The prototype stores no patient record and requires no API key, server or cloud model. After the first load, the service worker caches the UI and rules so the checker continues to work offline.

## Team video, target 45 to 55 seconds

Hi, I am Sang Truong, an AI engineer from Vietnam. My work spans LLM systems, clinical AI and production AI infrastructure.

I built RxCheck Pocket around a simple constraint: useful AI should not disappear when the internet does.

Instead of a general medical chatbot, this is a narrow medication-safety tool for frontline settings. It is offline-first, deterministic, source-traceable and designed to fail closed when it does not know.

The goal is not to replace pharmacists or clinicians. The goal is to give them a small, reliable first safety screen on an ordinary device.

## Demo video, target 50 to 60 seconds

This is RxCheck Pocket running entirely in the browser.

I enter sildenafil and nitroglycerin. The local engine immediately shows a red contraindication flag and links the FDA source.

Now I enter clarithromycin and warfarin. It returns an amber monitoring flag with the label-based bleeding and INR warning.

If I mistype sildenafil, the app does not autocorrect. It asks me to confirm the name.

And if no rule exists in this small dataset, it says so instead of claiming the pair is safe.

The app is installed as a PWA. After first load I can disconnect the network and the same checks still run locally.

## Technical video, target 50 to 60 seconds

RxCheck Pocket has no required backend and no cloud inference.

The service worker caches the static UI, alias map and deterministic rule engine. Each input is normalized locally, but unknown names fail closed. Pair rules and therapeutic-class reconciliation produce RED, AMBER, REVIEW or UNKNOWN findings.

Every curated interaction stores its public FDA provenance beside the rule.

The repository includes regression tests and a fixture evaluator. Those tests validate only the bundled demo behavior, not clinical sensitivity or specificity.

This architecture deliberately trades broad reasoning for traceability, tiny runtime cost and offline availability.

## Finalist pitch outline

### Slide 1: When the network disappears, the safety screen should not

- Problem: frontline medication checks can depend on connectivity and broad cloud systems.
- Constraint: ordinary device, intermittent network, short medication list.
- Product: local medication-name confirmation, deterministic checks, severity-first output, source traceability.
- Demo proof: disconnect network and repeat the same checks.

### Slide 2: Small on purpose

- No diagnosis, prescribing or dosing.
- Unknown medicine names fail closed.
- No-match is never presented as safe.
- Public-source rules are auditable.
- Path to impact: governed local formularies, current-label updates, local-language UX and formal validation.

## HackOS and backup form checklist

- [ ] Project name: RxCheck Pocket
- [ ] Challenge: World Bank Small AI for Development
- [ ] Sector: Health
- [ ] Public GitHub repository link
- [ ] Working live HTTPS demo
- [ ] Team selfie
- [ ] Team video, MP4/MOV, 60 seconds or less
- [ ] Demo video, MP4/MOV, 60 seconds or less
- [ ] Technical video, MP4/MOV, 60 seconds or less
- [ ] Submit in HackOS before the prize-eligible cutoff
- [ ] Submit the backup Google Form
- [ ] Recheck all links from a signed-out/private browser
