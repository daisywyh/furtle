export type CoverageCode = "G" | "NF" | "PA" | "CE" | "PSP" | "NPB" | "NPSP" | "UNKNOWN";

export const COVERAGE_CODE_LABELS: Record<CoverageCode, string> = {
  G: "Covered (Generic)",
  NF: "Non-Formulary",
  PA: "Prior Auth Required",
  CE: "Clinical Exception Required",
  PSP: "Specialty Pharmacy Required",
  NPB: "Not a Pharmacy Benefit",
  NPSP: "Non-Preferred Specialty",
  UNKNOWN: "Status Unknown",
};

export interface FormularyEntry {
  drugName: string;
  genericName: string;
  brandNames: string[];
  coverageCode: CoverageCode;
  tier: number | null;
  copay: string | null;
  priorAuthRequired: boolean;
  quantityLimit: string | null;
  stepTherapyRequired: boolean;
  notes: string | null;
  covered: boolean;
  genericAlternative?: string;
}

export interface FormularyData {
  planName: string;
  planYear: number;
  insurer: string;
  lastUpdated: string;
  drugs: FormularyEntry[];
}

export interface MedicationLookupResult {
  queriedName: string;
  entry: FormularyEntry | null;
  matchScore: number;
}
