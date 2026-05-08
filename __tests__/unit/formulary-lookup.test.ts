import { lookupDrugs, lookupByMedId, summarizeCoverage } from "@/lib/formulary-lookup";
import type { FormularyData } from "@/types/formulary";

const MOCK_FORMULARY: FormularyData = {
  planName: "Aetna 2026 Standard Plan",
  planYear: 2026,
  insurer: "Aetna",
  lastUpdated: "2026-01-01",
  drugs: [
    {
      drugName: "Gonal-F",
      genericName: "follitropin alfa",
      brandNames: ["Gonal-F", "Gonal-F RFF"],
      coverageCode: "NF" as const,
      tier: null,
      copay: null,
      priorAuthRequired: true,
      quantityLimit: null,
      stepTherapyRequired: false,
      notes: "Non-formulary",
      covered: false,
    },
    {
      drugName: "Clomid",
      genericName: "clomiphene citrate",
      brandNames: ["Clomid", "Serophene"],
      coverageCode: "G" as const,
      tier: null,
      copay: null,
      priorAuthRequired: false,
      quantityLimit: null,
      stepTherapyRequired: false,
      notes: null,
      covered: true,
    },
    {
      drugName: "Luveris",
      genericName: "lutropin alfa",
      brandNames: ["Luveris"],
      coverageCode: "UNKNOWN" as const,
      tier: null,
      copay: null,
      priorAuthRequired: false,
      quantityLimit: null,
      stepTherapyRequired: false,
      notes: "Not found in formulary",
      covered: false,
    },
    {
      drugName: "Femara",
      genericName: "letrozole",
      brandNames: ["Femara"],
      coverageCode: "NF" as const,
      tier: null,
      copay: null,
      priorAuthRequired: true,
      quantityLimit: null,
      stepTherapyRequired: false,
      notes: "Non-formulary",
      covered: false,
    },
  ],
};

describe("lookupDrugs (free-text)", () => {
  it("finds an exact brand name match", () => {
    const results = lookupDrugs(["Gonal-F"], MOCK_FORMULARY);
    expect(results).toHaveLength(1);
    expect(results[0].entry?.drugName).toBe("Gonal-F");
  });

  it("finds a match by generic name", () => {
    const results = lookupDrugs(["follitropin alfa"], MOCK_FORMULARY);
    expect(results[0].entry?.drugName).toBe("Gonal-F");
  });

  it("finds a fuzzy match for partial brand name", () => {
    const results = lookupDrugs(["Gonal F"], MOCK_FORMULARY);
    expect(results[0].entry?.drugName).toBe("Gonal-F");
  });

  it("finds a case-insensitive match", () => {
    const results = lookupDrugs(["clomid"], MOCK_FORMULARY);
    expect(results[0].entry?.drugName).toBe("Clomid");
  });

  it("returns null entry for an unrecognized drug", () => {
    const results = lookupDrugs(["CompletelyUnknownDrug12345"], MOCK_FORMULARY);
    expect(results[0].entry).toBeNull();
  });

  it("returns results for every queried drug", () => {
    const queried = ["Gonal-F", "Clomid", "UnknownDrug"];
    const results = lookupDrugs(queried, MOCK_FORMULARY);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.queriedName)).toEqual(queried);
  });
});

describe("lookupByMedId (predefined IVF medications)", () => {
  it("finds Femara by the 'letrozole' med ID using brand name index", () => {
    const result = lookupByMedId("letrozole", MOCK_FORMULARY);
    expect(result.entry?.drugName).toBe("Femara");
    expect(result.queriedName).toBe("Letrozole (Femara)");
  });

  it("finds Gonal-F by the 'gonal-f' med ID using brand name", () => {
    const result = lookupByMedId("gonal-f", MOCK_FORMULARY);
    expect(result.entry?.drugName).toBe("Gonal-F");
  });

  it("finds Gonal-F by the 'gonal-f' med ID using generic name follitropin alfa", () => {
    const result = lookupByMedId("gonal-f", MOCK_FORMULARY);
    // should resolve via either brand or generic name
    expect(result.entry).not.toBeNull();
  });

  it("returns null entry for an unknown med ID", () => {
    const result = lookupByMedId("nonexistent-med-id", MOCK_FORMULARY);
    expect(result.entry).toBeNull();
  });

  it("uses the display name as queriedName in results", () => {
    const result = lookupByMedId("letrozole", MOCK_FORMULARY);
    expect(result.queriedName).toContain("Letrozole");
  });
});

describe("summarizeCoverage", () => {
  it("correctly splits covered, not-covered, and not-found", () => {
    const results = lookupDrugs(["Clomid", "Luveris", "UnknownDrug"], MOCK_FORMULARY);
    const summary = summarizeCoverage(results);

    expect(summary.covered).toHaveLength(1);
    expect(summary.notCovered).toHaveLength(1);
    expect(summary.notFound).toHaveLength(1);
  });

  it("returns empty arrays when all drugs are covered without PA", () => {
    const results = lookupDrugs(["Clomid"], MOCK_FORMULARY);
    const summary = summarizeCoverage(results);

    expect(summary.notCovered).toHaveLength(0);
    expect(summary.notFound).toHaveLength(0);
    expect(summary.needsPriorAuth).toHaveLength(0);
  });
});
