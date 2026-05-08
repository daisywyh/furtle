export interface IvfMedication {
  id: string;
  displayName: string;
  genericName: string;
  brandNames: string[];
  group: MedicationGroup;
  description: string;
}

export type MedicationGroup =
  | "ovulation-induction"
  | "gonadotropins"
  | "gnrh-agents"
  | "progesterone"
  | "trigger-shots"
  | "estrogen";

export const MEDICATION_GROUPS: Record<MedicationGroup, string> = {
  "ovulation-induction": "Ovulation Induction",
  gonadotropins: "Gonadotropins (Injectable FSH/LH)",
  "gnrh-agents": "GnRH Agonists & Antagonists",
  progesterone: "Progesterone Support",
  "trigger-shots": "Trigger Shots (HCG)",
  estrogen: "Estrogen Support",
};

export const IVF_MEDICATIONS: IvfMedication[] = [
  // Ovulation Induction
  {
    id: "clomiphene",
    displayName: "Clomiphene Citrate (Clomid)",
    genericName: "clomiphene citrate",
    brandNames: ["Clomid", "Serophene"],
    group: "ovulation-induction",
    description: "Oral ovulation stimulant",
  },
  {
    id: "letrozole",
    displayName: "Letrozole (Femara)",
    genericName: "letrozole",
    brandNames: ["Femara"],
    group: "ovulation-induction",
    description: "Aromatase inhibitor used off-label for ovulation induction",
  },

  // Gonadotropins
  {
    id: "follistim",
    displayName: "Follistim AQ",
    genericName: "follitropin beta",
    brandNames: ["Follistim AQ"],
    group: "gonadotropins",
    description: "Injectable FSH for ovarian stimulation",
  },
  {
    id: "gonal-f",
    displayName: "Gonal-F",
    genericName: "follitropin alfa",
    brandNames: ["Gonal-F", "Gonal-F RFF"],
    group: "gonadotropins",
    description: "Injectable FSH for ovarian stimulation",
  },
  {
    id: "menopur",
    displayName: "Menopur",
    genericName: "menotropins",
    brandNames: ["Menopur"],
    group: "gonadotropins",
    description: "Injectable FSH + LH combination",
  },
  {
    id: "luveris",
    displayName: "Luveris",
    genericName: "lutropin alfa",
    brandNames: ["Luveris"],
    group: "gonadotropins",
    description: "Injectable LH supplement",
  },
  {
    id: "bravelle",
    displayName: "Bravelle",
    genericName: "urofollitropin",
    brandNames: ["Bravelle"],
    group: "gonadotropins",
    description: "Highly purified injectable FSH",
  },

  // GnRH Agents
  {
    id: "lupron",
    displayName: "Lupron (Leuprolide)",
    genericName: "leuprolide acetate",
    brandNames: ["Lupron", "Lupron Depot"],
    group: "gnrh-agents",
    description: "GnRH agonist — suppresses premature LH surge",
  },
  {
    id: "ganirelix",
    displayName: "Ganirelix Acetate",
    genericName: "ganirelix acetate",
    brandNames: ["Ganirelix", "Orgalutran"],
    group: "gnrh-agents",
    description: "GnRH antagonist — prevents premature ovulation",
  },
  {
    id: "cetrotide",
    displayName: "Cetrotide (Cetrorelix)",
    genericName: "cetrorelix acetate",
    brandNames: ["Cetrotide"],
    group: "gnrh-agents",
    description: "GnRH antagonist — prevents premature ovulation",
  },

  // Progesterone
  {
    id: "prometrium",
    displayName: "Prometrium (Progesterone Oral)",
    genericName: "progesterone",
    brandNames: ["Prometrium"],
    group: "progesterone",
    description: "Oral micronized progesterone for luteal support",
  },
  {
    id: "endometrin",
    displayName: "Endometrin (Progesterone Vaginal)",
    genericName: "progesterone",
    brandNames: ["Endometrin", "Crinone"],
    group: "progesterone",
    description: "Vaginal progesterone suppository for luteal support",
  },
  {
    id: "progesterone-injection",
    displayName: "Progesterone in Oil (Injection)",
    genericName: "progesterone in oil",
    brandNames: ["Progesterone in Oil"],
    group: "progesterone",
    description: "Intramuscular progesterone injection for luteal support",
  },

  // Trigger Shots
  {
    id: "hcg",
    displayName: "HCG (Chorionic Gonadotropin)",
    genericName: "chorionic gonadotropin",
    brandNames: ["Novarel", "Pregnyl", "Ovidrel"],
    group: "trigger-shots",
    description: "Trigger shot to induce final egg maturation",
  },

  // Estrogen
  {
    id: "estrace",
    displayName: "Estrace (Estradiol Tablets)",
    genericName: "estradiol",
    brandNames: ["Estrace"],
    group: "estrogen",
    description: "Oral estradiol for endometrial preparation",
  },
  {
    id: "vivelle",
    displayName: "Vivelle-Dot (Estradiol Patch)",
    genericName: "estradiol transdermal",
    brandNames: ["Vivelle-Dot", "Climara", "Minivelle"],
    group: "estrogen",
    description: "Estradiol patch for endometrial preparation",
  },
];
