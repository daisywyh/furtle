import { IVF_MEDICATIONS, MEDICATION_GROUPS, GROUPS_ORDER } from "@/lib/ivf-medications";

// Re-export GROUPS_ORDER for testing since it's defined in page.tsx — test the data directly
const ALL_GROUPS = [
  "ovulation-induction",
  "gonadotropins",
  "gnrh-agents",
  "progesterone",
  "trigger-shots",
  "estrogen",
] as const;

describe("IVF_MEDICATIONS", () => {
  it("has at least 15 medications", () => {
    expect(IVF_MEDICATIONS.length).toBeGreaterThanOrEqual(15);
  });

  it("every medication has required fields", () => {
    for (const med of IVF_MEDICATIONS) {
      expect(med.id).toBeTruthy();
      expect(med.displayName).toBeTruthy();
      expect(med.genericName).toBeTruthy();
      expect(med.group).toBeTruthy();
      expect(Array.isArray(med.brandNames)).toBe(true);
    }
  });

  it("every medication has a unique id", () => {
    const ids = IVF_MEDICATIONS.map((m) => m.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every medication belongs to a valid group", () => {
    const validGroups = new Set(ALL_GROUPS);
    for (const med of IVF_MEDICATIONS) {
      expect(validGroups.has(med.group as (typeof ALL_GROUPS)[number])).toBe(true);
    }
  });

  it("all key IVF medications are present", () => {
    const ids = new Set(IVF_MEDICATIONS.map((m) => m.id));
    const required = [
      "clomiphene",
      "letrozole",
      "gonal-f",
      "follistim",
      "menopur",
      "lupron",
      "ganirelix",
      "cetrotide",
      "prometrium",
      "endometrin",
      "hcg",
      "estrace",
      "vivelle",
    ];
    for (const id of required) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe("MEDICATION_GROUPS", () => {
  it("has a display label for every group", () => {
    for (const group of ALL_GROUPS) {
      expect(MEDICATION_GROUPS[group]).toBeTruthy();
    }
  });
});
