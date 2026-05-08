/**
 * One-time script to parse the Aetna 2026 Standard Plan formulary PDF
 * into a structured JSON file consumed by the frontend.
 *
 * Usage: npm run parse-formulary
 *
 * Output: data/formulary-aetna-2026.json (committed to repo)
 *
 * Coverage codes found in this PDF:
 *   G    = Generic/Preferred — covered, no prior auth
 *   NF   = Non-Formulary — NOT covered (requires exception)
 *   PA   = Prior Authorization Required — covered with PA
 *   CE   = Clinical Exception Required — covered with criteria
 *   PSP  = Preferred Specialty Program — covered via specialty pharmacy
 *   NPB  = Not a Pharmacy Benefit
 *   NPSP = Non-Preferred Specialty Program — not covered
 */

import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

// Coverage code → meaning
type CoverageCode = "G" | "NF" | "PA" | "CE" | "PSP" | "NPB" | "NPSP" | "UNKNOWN";

const CODE_TO_COVERED: Record<CoverageCode, boolean> = {
  G: true,
  NF: false,
  PA: true,
  CE: true,
  PSP: true,
  NPB: false,
  NPSP: false,
  UNKNOWN: false,
};

const CODE_TO_PRIOR_AUTH: Record<CoverageCode, boolean> = {
  G: false,
  NF: true,   // technically needs an exception, which is a PA process
  PA: true,
  CE: true,
  PSP: false,
  NPB: false,
  NPSP: true,
  UNKNOWN: false,
};

const CODE_TO_NOTES: Record<CoverageCode, string | null> = {
  G: null,
  NF: "Non-formulary — prior authorization or exception required",
  PA: "Prior authorization required",
  CE: "Clinical exception required",
  PSP: "Must be filled at a Preferred Specialty Pharmacy",
  NPB: "Not a pharmacy benefit under this plan",
  NPSP: "Non-preferred specialty — not covered",
  UNKNOWN: "Coverage status unknown — contact Aetna",
};

// All IVF-relevant drug search terms
interface DrugTarget {
  key: string;
  genericName: string;
  brandNames: string[];
  searchTerms: string[];
  genericAlternative?: string;
}

const IVF_DRUG_TARGETS: DrugTarget[] = [
  {
    key: "clomiphene",
    genericName: "clomiphene citrate",
    brandNames: ["Clomid", "Serophene"],
    searchTerms: ["clomiphene", "clomid", "serophene"],
  },
  {
    key: "letrozole",
    genericName: "letrozole",
    brandNames: ["Femara"],
    searchTerms: ["letrozole oral tablet", "femara"],
    genericAlternative: "letrozole oral tablet 2.5 mg (generic) — covered",
  },
  {
    key: "follitropin alfa",
    genericName: "follitropin alfa",
    brandNames: ["Gonal-F", "Gonal-F RFF"],
    searchTerms: ["gonal-f", "gonal f", "follitropin alfa"],
  },
  {
    key: "follitropin beta",
    genericName: "follitropin beta",
    brandNames: ["Follistim AQ"],
    searchTerms: ["follistim", "follitropin beta"],
  },
  {
    key: "menotropins",
    genericName: "menotropins",
    brandNames: ["Menopur"],
    searchTerms: ["menopur", "menotropins"],
  },
  {
    key: "lutropin alfa",
    genericName: "lutropin alfa",
    brandNames: ["Luveris"],
    searchTerms: ["luveris", "lutropin"],
  },
  {
    key: "urofollitropin",
    genericName: "urofollitropin",
    brandNames: ["Bravelle"],
    searchTerms: ["bravelle", "urofollitropin"],
  },
  {
    key: "leuprolide",
    genericName: "leuprolide acetate",
    brandNames: ["Lupron", "Lupron Depot"],
    searchTerms: ["lupron depot (1-month) intramuscular", "lupron depot intramuscular kit"],
    genericAlternative: "leuprolide acetate injection kit 1 mg/0.2 mL (generic) — covered",
  },
  {
    key: "ganirelix",
    genericName: "ganirelix acetate",
    brandNames: ["Ganirelix", "Fyremadel"],
    searchTerms: ["ganirelix", "fyremadel"],
  },
  {
    key: "cetrorelix",
    genericName: "cetrorelix acetate",
    brandNames: ["Cetrotide"],
    searchTerms: ["cetrotide", "cetrorelix"],
  },
  {
    key: "progesterone",
    genericName: "progesterone",
    brandNames: ["Prometrium", "Endometrin", "Crinone"],
    searchTerms: ["prometrium", "endometrin", "crinone"],
    genericAlternative: "progesterone oral capsule 100 mg / 200 mg (generic) — covered",
  },
  {
    key: "chorionic gonadotropin",
    genericName: "chorionic gonadotropin",
    brandNames: ["Novarel", "Pregnyl", "Ovidrel"],
    searchTerms: ["novarel", "pregnyl", "ovidrel", "chorionic gonadotropin"],
  },
  {
    key: "estradiol",
    genericName: "estradiol",
    brandNames: ["Estrace"],
    searchTerms: ["estrace", "estradiol oral", "estradiol tablet"],
    genericAlternative: "estradiol oral tablet 0.5 mg / 1 mg / 2 mg (generic) — covered",
  },
  {
    key: "estradiol transdermal",
    genericName: "estradiol transdermal",
    brandNames: ["Vivelle-Dot", "Vivelle", "Climara"],
    searchTerms: ["vivelle", "climara", "estradiol patch", "estradiol transdermal"],
  },
];

interface ParsedDrug {
  drugName: string;
  genericName: string;
  brandNames: string[];
  coverageCode: string;
  tier: null;
  copay: string | null;
  priorAuthRequired: boolean;
  quantityLimit: string | null;
  stepTherapyRequired: boolean;
  notes: string | null;
  covered: boolean;
  genericAlternative: string | null;
  matchedLine: string;
}

function normalizeLine(line: string): string {
  return line.toLowerCase().replace(/[^a-z0-9\s\-]/g, " ").trim();
}

function extractCoverageCode(chunk: string): CoverageCode {
  // Codes appear at end of line or on next line, sometimes run-together
  // Match the last occurrence of a known code pattern in the chunk
  const codePattern = /\b(NPSP|NPB|PSP|NF|PA|CE|G)\b/g;
  let lastMatch: RegExpExecArray | null = null;
  let m;
  while ((m = codePattern.exec(chunk)) !== null) {
    lastMatch = m;
  }
  if (lastMatch) return lastMatch[1] as CoverageCode;
  return "UNKNOWN";
}

function findDrugInText(
  target: DrugTarget,
  lines: string[]
): ParsedDrug | null {
  for (let i = 0; i < lines.length; i++) {
    const normalLine = normalizeLine(lines[i]);
    const matched = target.searchTerms.some((term) =>
      normalLine.includes(normalizeLine(term))
    );

    if (!matched) continue;

    // Gather context: current + next 3 lines for the coverage code
    const chunk = lines
      .slice(i, Math.min(i + 4, lines.length))
      .join(" ");

    const code = extractCoverageCode(chunk);

    // Skip index entries (lines with "...." are the table of contents)
    if (lines[i].includes("....")) continue;

    // Skip header/footer lines
    if (/pharmacy drug guide|aetna standard plan|formulary is updated/i.test(lines[i])) continue;

    return {
      drugName: target.brandNames[0],
      genericName: target.genericName,
      brandNames: target.brandNames,
      coverageCode: code,
      tier: null,
      copay: null,
      priorAuthRequired: CODE_TO_PRIOR_AUTH[code] ?? false,
      quantityLimit: null,
      stepTherapyRequired: false,
      notes: CODE_TO_NOTES[code],
      covered: CODE_TO_COVERED[code] ?? false,
      genericAlternative: target.genericAlternative ?? null,
      matchedLine: lines[i].trim(),
    };
  }
  return null;
}

async function parseFormulary(pdfPath: string): Promise<ParsedDrug[]> {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  const text = data.text;

  console.log(`Extracted ${text.length} characters from PDF (${data.numpages} pages)\n`);

  const rawPath = path.join(path.dirname(pdfPath), "formulary-raw-text.txt");
  fs.writeFileSync(rawPath, text);

  const lines = text.split("\n");
  const results: ParsedDrug[] = [];

  for (const target of IVF_DRUG_TARGETS) {
    const found = findDrugInText(target, lines);

    if (found) {
      results.push(found);
      console.log(
        `  FOUND:     ${found.drugName.padEnd(20)} | Code: ${found.coverageCode.padEnd(6)} | Covered: ${String(found.covered).padEnd(5)} | PA: ${found.priorAuthRequired}`
      );
    } else {
      const notFound: ParsedDrug = {
        drugName: target.brandNames[0],
        genericName: target.genericName,
        brandNames: target.brandNames,
        coverageCode: "UNKNOWN",
        tier: null,
        copay: null,
        priorAuthRequired: false,
        quantityLimit: null,
        stepTherapyRequired: false,
        notes: "Not found in formulary — contact Aetna to verify",
        covered: false,
        genericAlternative: target.genericAlternative ?? null,
        matchedLine: "",
      };
      results.push(notFound);
      console.log(`  NOT FOUND: ${target.brandNames[0]}`);
    }
  }

  return results;
}

async function main() {
  const pdfPath = path.resolve(__dirname, "../data/2026_Aetna_Standard_Plan.pdf");

  if (!fs.existsSync(pdfPath)) {
    console.error(`\nERROR: PDF not found at ${pdfPath}`);
    console.error("Place the Aetna formulary PDF in the data/ directory.");
    process.exit(1);
  }

  console.log("Parsing Aetna 2026 Standard Plan formulary...\n");

  const drugs = await parseFormulary(pdfPath);

  const output = {
    planName: "Aetna 2026 Standard Plan",
    planYear: 2026,
    insurer: "Aetna",
    lastUpdated: new Date().toISOString().split("T")[0],
    drugs,
  };

  const outPath = path.resolve(__dirname, "../data/formulary-aetna-2026.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\nOutput: ${outPath}`);
  console.log(`  Covered:        ${drugs.filter((d) => d.covered).length}`);
  console.log(`  Not covered:    ${drugs.filter((d) => !d.covered).length}`);
  console.log(`  Prior auth req: ${drugs.filter((d) => d.priorAuthRequired).length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
