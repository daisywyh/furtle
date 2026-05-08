import Fuse from "fuse.js";
import type { FormularyData, FormularyEntry, MedicationLookupResult } from "@/types/formulary";
import { IVF_MEDICATIONS, type IvfMedication } from "@/lib/ivf-medications";

let cachedFormulary: FormularyData | null = null;

export async function loadFormulary(): Promise<FormularyData> {
  if (cachedFormulary) return cachedFormulary;
  const res = await fetch("/data/formulary-aetna-2026.json", { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load formulary data");
  cachedFormulary = await res.json();
  return cachedFormulary!;
}

// Look up a predefined IVF medication by its ID, using all known brand/generic names.
// Returns the best formulary match across all aliases.
export function lookupByMedId(
  medId: string,
  formulary: FormularyData
): MedicationLookupResult {
  const med = IVF_MEDICATIONS.find((m) => m.id === medId);
  if (!med) {
    return { queriedName: medId, entry: null, matchScore: 0 };
  }

  const searchTerms = [med.genericName, ...med.brandNames];
  const index = buildSearchIndex(formulary.drugs);

  let bestEntry: FormularyEntry | null = null;
  let bestScore = Infinity;

  for (const term of searchTerms) {
    const hits = index.search(term);
    if (hits.length > 0 && (hits[0].score ?? 1) < bestScore) {
      bestScore = hits[0].score ?? 1;
      bestEntry = hits[0].item;
    }
  }

  return {
    queriedName: med.displayName,
    entry: bestEntry,
    matchScore: bestEntry ? 1 - bestScore : 0,
  };
}

// Look up free-text drug names with fuzzy matching.
export function lookupDrugs(
  queriedNames: string[],
  formulary: FormularyData
): MedicationLookupResult[] {
  const index = buildSearchIndex(formulary.drugs);

  return queriedNames.map((name) => {
    const results = index.search(name);
    if (results.length === 0) {
      return { queriedName: name, entry: null, matchScore: 0 };
    }
    const best = results[0];
    return {
      queriedName: name,
      entry: best.item,
      matchScore: best.score ? 1 - best.score : 1,
    };
  });
}

function buildSearchIndex(drugs: FormularyEntry[]) {
  const searchableEntries = drugs.flatMap((drug) => [
    { ...drug, _searchName: drug.drugName },
    { ...drug, _searchName: drug.genericName },
    ...drug.brandNames.map((b) => ({ ...drug, _searchName: b })),
  ]);

  return new Fuse(searchableEntries, {
    keys: ["_searchName"],
    threshold: 0.35,
    includeScore: true,
  });
}

export function summarizeCoverage(results: MedicationLookupResult[]) {
  const covered = results.filter((r) => r.entry?.covered);
  const notCovered = results.filter((r) => r.entry && !r.entry.covered);
  const notFound = results.filter((r) => !r.entry);
  const needsPriorAuth = covered.filter((r) => r.entry?.priorAuthRequired);

  return { covered, notCovered, notFound, needsPriorAuth };
}

// Exported for use in results page
export type { IvfMedication };
