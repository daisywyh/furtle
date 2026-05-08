# Debugging Log

## Build Issues Fixed

### 1. `create-next-app` conflict with existing `.agents/` directory
**Problem:** `npx create-next-app@latest .` exits with error because `.agents/`, `README.md`, and `skills-lock.json` already exist in the project root.
**Fix:** Scaffolded the Next.js project manually — wrote `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs` by hand.

### 2. Next.js 15.3.2 security vulnerability (CVE-2025-66478)
**Problem:** `npm install` warns that `next@15.3.2` has a critical security vulnerability.
**Fix:** Ran `npm install next@latest eslint-config-next@latest`, which upgraded to `next@16.2.6`.
**Note:** Two remaining `moderate` postcss vulnerabilities are inside Next.js itself — `npm audit fix --force` would downgrade to Next.js 9.3.3 which is worse. Leave as-is until Next.js patches them upstream.

### 3. `experimental.serverComponentsExternalPackages` renamed in Next.js 16
**Problem:** `next.config.ts` used `experimental.serverComponentsExternalPackages` — now an unrecognized key in Next.js 16.
**Fix:** Moved to top-level `serverExternalPackages` in `next.config.ts`.

### 4. `PDFForm` variable shadowing `form` state in paperwork page
**Problem:** `const form = pdfDoc.getForm()` inside `generatePdf()` shadowed the React state variable `form` (a `PatientInfo` object). TypeScript error: argument of type `{drugName: string; acroForm: PDFAcroForm; ...}` is not assignable to `PatientInfo`.
**Fix:** Renamed the pdf-lib form variable to `acroForm` throughout `generatePdf()`.

### 5. `Uint8Array<ArrayBufferLike>` not assignable to `BlobPart`
**Problem:** `pdf-lib`'s `pdfDoc.save()` returns `Uint8Array<ArrayBufferLike>` in strict TypeScript, which is not assignable to `Blob`'s `BlobPart` type (which requires `ArrayBuffer`, not `ArrayBufferLike`).
**Fix:** Cast: `new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" })`.

### 6. `useSearchParams()` requires Suspense boundary in App Router
**Problem:** Build error — `useSearchParams()` on `/results` and `/paperwork` pages causes prerender failure without a Suspense boundary.
**Fix:** Split each page into a shell component (`ResultsPage`, `PaperworkPage`) that wraps the content component (`ResultsContent`, `PaperworkContent`) in `<Suspense>`. The shell is the default export; the content component uses `useSearchParams()`.

---

## Formulary PDF Parsing Issues

### 7. Tier numbers not found in Aetna PDF
**Problem:** Initial parser assumed formulary uses numeric tiers (Tier 1/2/3/4). All tier results came back `null`.
**Root cause:** Aetna 2026 Standard Plan uses abbreviation codes rather than tier numbers.
**Fix:** Rewrote parser to extract coverage codes: `G` (covered generic), `NF` (non-formulary), `PA` (prior auth), `CE` (clinical exception), `PSP` (preferred specialty pharmacy), `NPB` (not a pharmacy benefit), `NPSP` (non-preferred specialty).

### 8. Parentheses stripped by normalization but not from search terms
**Problem:** `normalizeLine()` strips non-alphanumeric characters, so the line `LUPRON DEPOT (1-MONTH) INTRAMUSCULAR KIT 3.75 MG` becomes `lupron depot 1 month intramuscular kit 3 75`. The search term `lupron depot (1-month) intramuscular` was NOT normalized, causing `includes()` to fail.
**Fix:** Applied `normalizeLine()` to both the extracted line AND the search term before comparison.

### 9. `formulary-raw-text.txt` was being kept in `data/`
**Note:** The raw extracted text file is 500,000+ characters. Added to `.gitignore` — it's a build artifact, not source.

---

## Drugs Not Found in Formulary

| Drug | Status | Notes |
|---|---|---|
| Clomid / Clomiphene | Not in PDF | Not listed in formulary at all — likely not covered or treated as OTC |
| Luveris (lutropin alfa) | Not in PDF | Not listed — LH supplements are rarely formulary-covered |
| Bravelle (urofollitropin) | Not in PDF | Discontinued in the US market |

---

## Real Coverage Data from Aetna 2026 Standard Plan

Key IVF drugs and their actual Aetna coverage status:

| Drug | Code | Covered | Notes |
|---|---|---|---|
| Femara (letrozole) | NF | No | Generic letrozole tablet **is** covered (G) |
| Gonal-F | NF | No | Brand non-formulary |
| Follistim AQ | PSP | Yes | Preferred Specialty Pharmacy only |
| Menopur | PSP | Yes | Preferred Specialty Pharmacy only |
| Lupron Depot (brand) | NF | No | Generic leuprolide acetate injection **is** covered (G) |
| Ganirelix | NF | No | — |
| Cetrotide | NF | No | — |
| Prometrium (brand) | NF | No | Generic progesterone capsule **is** covered (G) |
| Novarel / HCG | NF | No | — |
| Estrace (brand) | CE | Yes | Clinical exception required |
| Vivelle-Dot | CE | Yes | Clinical exception required |

**Key insight for patients:** Many brand-name IVF drugs are non-formulary on Aetna, but generic equivalents for letrozole, progesterone, leuprolide injection, and estradiol tablets are covered. Ask your doctor to prescribe generics where possible.

---

## Tests

All 36 tests pass as of initial build. Test files:
- `__tests__/unit/formulary-lookup.test.ts` — lookupDrugs, summarizeCoverage
- `__tests__/unit/utils.test.ts` — buildMapsUrl, buildMyChartMessage
- `__tests__/unit/ivf-medications.test.ts` — IVF_MEDICATIONS data integrity
- `__tests__/integration/home-page.test.tsx` — HomePage rendering and form behavior
