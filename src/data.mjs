export const DATASET_VERSION = "2026-10-04-demo-v1";

export const SOURCE_NOTES = {
  viagra: {
    title: "VIAGRA (sildenafil citrate) FDA label",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2015/020895s045lbl.pdf",
    note: "FDA public label, Drug Interactions 7.1 Nitrates. Archived label used for this hackathon prototype; production use requires current-label refresh."
  },
  biaxin: {
    title: "BIAXIN (clarithromycin) FDA label",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/050698s031lbl.pdf",
    note: "FDA public label. Oral anticoagulants and HMG-CoA reductase inhibitor interaction sections."
  },
  zoloft: {
    title: "ZOLOFT (sertraline hydrochloride) FDA label",
    url: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2016/019839S74S86S87_20990S35S44S45lbl.pdf",
    note: "FDA public label. Contraindications and Increased Risk of Bleeding sections."
  },
  nsaids: {
    title: "FDA NSAID safety information",
    url: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-recommends-avoiding-use-nsaids-pregnancy-20-weeks-or-later-because-they-can-result-low-amniotic",
    note: "FDA page identifies aspirin, ibuprofen and naproxen as NSAIDs. Used only for therapeutic-class reconciliation."
  },
  statins: {
    title: "FDA Cholesterol Medicines Guide",
    url: "https://www.fda.gov/consumers/womens-health-topics/cholesterol-medicines-guide",
    note: "FDA page identifies lovastatin and simvastatin as statins. Used only for therapeutic-class reconciliation."
  }
};

export const DRUGS = {
  sildenafil: { aliases: ["viagra"], class: "pde5_inhibitor" },
  nitroglycerin: { aliases: ["glyceryl trinitrate", "gtn"], class: "nitrate" },
  "isosorbide mononitrate": { aliases: ["imdur"], class: "nitrate" },
  "isosorbide dinitrate": { aliases: ["isordil"], class: "nitrate" },
  clarithromycin: { aliases: ["biaxin"], class: "macrolide" },
  simvastatin: { aliases: ["zocor", "flolipid"], class: "statin" },
  lovastatin: { aliases: ["mevacor", "altoprev"], class: "statin" },
  warfarin: { aliases: ["coumadin"], class: "vitamin_k_antagonist" },
  sertraline: { aliases: ["zoloft"], class: "ssri" },
  ibuprofen: { aliases: ["advil", "motrin"], class: "nsaid" },
  naproxen: { aliases: ["aleve"], class: "nsaid" },
  aspirin: { aliases: ["acetylsalicylic acid", "asa"], class: "nsaid" },
  pimozide: { aliases: ["orap"], class: "antipsychotic" },
  phenelzine: { aliases: ["nardil"], class: "maoi" }
};

export const RULES = [
  {
    id: "sildenafil-nitrates",
    left: ["sildenafil"],
    right: ["nitroglycerin", "isosorbide mononitrate", "isosorbide dinitrate"],
    status: "RED",
    label: "Contraindicated combination",
    summary: "Sildenafil with an organic nitrate is contraindicated in the FDA label.",
    rationale: "Sildenafil can potentiate the blood-pressure-lowering effect of nitrates.",
    action: "Treat this as an urgent medication-reconciliation flag and verify with a clinician or pharmacist.",
    source: SOURCE_NOTES.viagra
  },
  {
    id: "clarithromycin-simvastatin-lovastatin",
    left: ["clarithromycin"],
    right: ["simvastatin", "lovastatin"],
    status: "RED",
    label: "Contraindicated combination",
    summary: "The FDA clarithromycin label lists concomitant simvastatin or lovastatin as contraindicated.",
    rationale: "Clarithromycin can increase exposure to these CYP3A4-metabolized statins and increase myopathy risk.",
    action: "Escalate for clinician or pharmacist verification before relying on the medication list.",
    source: SOURCE_NOTES.biaxin
  },
  {
    id: "clarithromycin-warfarin",
    left: ["clarithromycin"],
    right: ["warfarin"],
    status: "AMBER",
    label: "High-risk monitoring interaction",
    summary: "The FDA clarithromycin label reports risk of serious hemorrhage and significant INR elevation with warfarin.",
    rationale: "Concurrent use can increase anticoagulation effect and bleeding risk.",
    action: "Flag for prompt clinician or pharmacist review and monitoring verification.",
    source: SOURCE_NOTES.biaxin
  },
  {
    id: "sertraline-bleeding-risk",
    left: ["sertraline"],
    right: ["warfarin", "aspirin", "ibuprofen", "naproxen"],
    status: "AMBER",
    label: "Bleeding-risk interaction",
    summary: "The FDA sertraline label warns that aspirin, NSAIDs, antiplatelet drugs, warfarin and other anticoagulants can increase bleeding risk.",
    rationale: "Sertraline can add to bleeding risk when combined with medicines that affect hemostasis.",
    action: "Flag for clinician or pharmacist review, especially when bleeding risk is clinically relevant.",
    source: SOURCE_NOTES.zoloft
  },
  {
    id: "sertraline-pimozide",
    left: ["sertraline"],
    right: ["pimozide"],
    status: "RED",
    label: "Contraindicated combination",
    summary: "Concomitant pimozide is listed as a contraindication in the FDA sertraline label.",
    rationale: "This prototype intentionally does not infer beyond the label-level contraindication.",
    action: "Escalate for clinician or pharmacist verification.",
    source: SOURCE_NOTES.zoloft
  },
  {
    id: "sertraline-maoi",
    left: ["sertraline"],
    right: ["phenelzine"],
    status: "RED",
    label: "Contraindicated combination",
    summary: "The FDA sertraline label contraindicates concomitant use with monoamine oxidase inhibitors.",
    rationale: "Phenelzine is represented in this bounded demo as an MAOI example.",
    action: "Escalate for clinician or pharmacist verification.",
    source: SOURCE_NOTES.zoloft
  }
];

export const CLASS_REVIEW = {
  nsaid: {
    status: "REVIEW",
    label: "Therapeutic-class duplication",
    summary: "Two medicines in the NSAID class were detected.",
    rationale: "This is a reconciliation prompt, not a claim that the specific pair is always inappropriate.",
    action: "Ask a clinician or pharmacist to confirm whether both medicines are intended.",
    source: SOURCE_NOTES.nsaids
  },
  statin: {
    status: "REVIEW",
    label: "Therapeutic-class duplication",
    summary: "Two medicines in the statin class were detected.",
    rationale: "This is a reconciliation prompt, not a claim that the specific pair is always inappropriate.",
    action: "Ask a clinician or pharmacist to confirm whether both medicines are intended.",
    source: SOURCE_NOTES.statins
  }
};
