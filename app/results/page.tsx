"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { lookupDrugs, lookupByMedId, summarizeCoverage } from "@/lib/formulary-lookup";
import { buildMapsUrl, buildMyChartMessage } from "@/lib/utils";
import type { FormularyData, MedicationLookupResult } from "@/types/formulary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { COVERAGE_CODE_LABELS } from "@/types/formulary";

const SPECIALTY_PHARMACIES = [
  { name: "Freedom Fertility Pharmacy", url: "https://www.freedomfertility.com" },
  { name: "Axia Women's Health Pharmacy", url: "https://www.axiawomenshealth.com" },
  { name: "CVS Specialty", url: "https://www.cvsspecialty.com" },
  { name: "Walgreens Specialty Pharmacy", url: "https://www.walgreens.com/pharmacy/specialty" },
];

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const medIds = searchParams.getAll("medId");   // predefined IVF medication IDs
  const freeDrugs = searchParams.getAll("drug"); // free-text drug names
  const zip = searchParams.get("zip") || "";

  const [formulary, setFormulary] = useState<FormularyData | null>(null);
  const [results, setResults] = useState<MedicationLookupResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [patientName, setPatientName] = useState("");

  const runLookup = useCallback(
    (data: FormularyData) => {
      const idResults = medIds.map((id) => lookupByMedId(id, data));
      const freeResults = lookupDrugs(freeDrugs, data);
      setResults([...idResults, ...freeResults]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [medIds.join(","), freeDrugs.join(",")]
  );

  useEffect(() => {
    if (medIds.length === 0 && freeDrugs.length === 0) {
      router.replace("/");
      return;
    }

    async function load() {
      try {
        const res = await fetch("/data/formulary-aetna-2026.json");
        if (!res.ok) throw new Error("Formulary not available");
        const data: FormularyData = await res.json();
        setFormulary(data);
        runLookup(data);
      } catch {
        setError(
          "Could not load formulary data. Please try again or contact support."
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medIds.length, freeDrugs.length, router, runLookup]);

  const { covered, notCovered, notFound, needsPriorAuth } =
    summarizeCoverage(results);

  const coveredNames = covered.map((r) => r.queriedName);
  const notCoveredNames = notCovered.map((r) => r.queriedName);
  const priorAuthNames = needsPriorAuth.map((r) => r.queriedName);

  const message = buildMyChartMessage({
    patientName,
    insurer: formulary?.insurer || "Aetna",
    coveredDrugs: coveredNames,
    notCoveredDrugs: notCoveredNames,
    priorAuthDrugs: priorAuthNames,
  });

  async function copyMessage() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Checking your coverage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coverage Results</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formulary?.planName} · {results.length} medication
            {results.length !== 1 ? "s" : ""} checked
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            ← New check
          </Button>
        </Link>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Covered",
            count: covered.length,
            color: "text-green-700 bg-green-50 border-green-100",
          },
          {
            label: "Prior Auth Required",
            count: needsPriorAuth.length,
            color: "text-amber-700 bg-amber-50 border-amber-100",
          },
          {
            label: "Not Covered",
            count: notCovered.length + notFound.length,
            color: "text-red-700 bg-red-50 border-red-100",
          },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className={`rounded-xl border p-4 text-center ${color}`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Drug cards */}
      <div className="space-y-3">
        {results.map((result) => (
          <DrugResultCard key={result.queriedName} result={result} />
        ))}
      </div>

      {/* What to ask your doctor */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            What to ask your doctor
          </h3>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex gap-2">
              <span>•</span>
              <span>
                Request the generic equivalent if a brand-name drug isn&apos;t
                covered or is on a high tier.
              </span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>
                Ask your doctor to direct prescriptions to a{" "}
                <strong>specialty fertility pharmacy</strong> — not all retail
                pharmacies stock injectable gonadotropins.
              </span>
            </li>
            {(notCovered.length > 0 || needsPriorAuth.length > 0) && (
              <li className="flex gap-2">
                <span>•</span>
                <span>
                  For drugs requiring prior authorization or that are
                  non-formulary, ask your doctor to submit the prior auth form
                  to Aetna.{" "}
                  <Link
                    href="/paperwork"
                    className="text-rose-600 hover:underline font-medium"
                  >
                    Generate paperwork →
                  </Link>
                </span>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Pharmacy finder */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Find a Specialty Fertility Pharmacy
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Not all pharmacies carry injectable fertility medications. These
            pharmacies specialize in IVF medications:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {SPECIALTY_PHARMACIES.map((pharmacy) => (
              <a
                key={pharmacy.name}
                href={pharmacy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-rose-600 hover:text-rose-700 hover:underline"
              >
                {pharmacy.name} ↗
              </a>
            ))}
          </div>
          {zip && (
            <a
              href={buildMapsUrl(zip)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Search pharmacies near {zip} on Google Maps
              </Button>
            </a>
          )}
        </CardContent>
      </Card>

      {/* MyChart message */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Message your provider
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Copy this pre-written message and send it to your doctor through
            Epic MyChart.
          </p>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Your name (optional)
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Your name"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 mb-3"
            />
          </div>
          <textarea
            readOnly
            value={message}
            rows={14}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 resize-none font-mono"
            aria-label="Pre-written provider message"
          />
          <div className="flex gap-3">
            <Button onClick={copyMessage} size="sm">
              {copied ? "Copied!" : "Copy to clipboard"}
            </Button>
            <a
              href="https://mychart.stanfordhealthcare.org/mychart/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                Open MyChart ↗
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DrugResultCard({ result }: { result: MedicationLookupResult }) {
  const { queriedName, entry } = result;

  if (!entry) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">{queriedName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Not found in formulary — contact your insurer to verify
            </p>
          </div>
          <Badge variant="not-covered">Not Found</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{queriedName}</p>
            {entry.genericName && entry.genericName !== queriedName.toLowerCase() && (
              <p className="text-xs text-gray-500">
                Generic: {entry.genericName}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
            {entry.covered ? (
              <Badge variant="covered">
                {COVERAGE_CODE_LABELS[entry.coverageCode] ?? "Covered"}
              </Badge>
            ) : (
              <Badge variant="not-covered">
                {COVERAGE_CODE_LABELS[entry.coverageCode] ?? "Non-Formulary"}
              </Badge>
            )}
            {entry.priorAuthRequired && !["NF", "NPSP"].includes(entry.coverageCode) && (
              <Badge variant="prior-auth">Prior Auth Required</Badge>
            )}
          </div>
        </div>

        {entry.covered && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            {entry.copay && <span>Copay: {entry.copay}</span>}
            {entry.quantityLimit && (
              <span>Qty limit: {entry.quantityLimit}</span>
            )}
            {entry.notes && <span className="italic">{entry.notes}</span>}
          </div>
        )}

        {entry.genericAlternative && (
          <div className="mt-2 rounded-lg bg-green-50 border border-green-100 px-3 py-2">
            <p className="text-xs text-green-700">
              <span className="font-medium">Generic alternative available: </span>
              {entry.genericAlternative}
            </p>
          </div>
        )}

        {!entry.covered && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link href={`/paperwork?drug=${encodeURIComponent(queriedName)}`}>
              <Button variant="outline" size="sm">
                Generate Prior Auth Paperwork
              </Button>
            </Link>
          </div>
        )}

        {entry.priorAuthRequired && entry.covered && (
          <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <p className="text-xs text-amber-700">
              Your insurer requires prior authorization before this drug is
              covered. Ask your doctor to submit the PA request.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
