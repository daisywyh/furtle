"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IVF_MEDICATIONS, MEDICATION_GROUPS, type MedicationGroup } from "@/lib/ivf-medications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const GROUPS_ORDER: MedicationGroup[] = [
  "ovulation-induction",
  "gonadotropins",
  "gnrh-agents",
  "progesterone",
  "trigger-shots",
  "estrogen",
];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [freeText, setFreeText] = useState("");
  const [zip, setZip] = useState("");

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const extra = freeText
      .split(/[,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (selected.size === 0 && extra.length === 0) return;

    const params = new URLSearchParams();
    // Predefined meds go as IDs so the results page can search by all known names
    selected.forEach((id) => params.append("medId", id));
    // Free-text drugs are passed as raw strings
    extra.forEach((d) => params.append("drug", d));
    if (zip) params.set("zip", zip);
    router.push(`/results?${params.toString()}`);
  }

  const selectedCount = selected.size;

  return (
    <div className="space-y-8">
      {/* How it works */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Check your IVF medication coverage
        </h2>
        <p className="text-gray-500 max-w-xl mx-auto">
          Select your prescribed fertility medications and we&apos;ll check your
          Aetna formulary coverage — including tier, copay, and prior
          authorization requirements.
        </p>
      </div>

      <div className="flex gap-6 text-center">
        {[
          { step: "1", label: "Select your medications" },
          { step: "2", label: "Check coverage instantly" },
          { step: "3", label: "Get next steps & paperwork" },
        ].map(({ step, label }) => (
          <div key={step} className="flex-1 space-y-1">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 font-bold text-sm flex items-center justify-center mx-auto">
              {step}
            </div>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
          <span className="font-medium text-blue-700">Insurance plan:</span>
          <span>Aetna 2026 Standard Plan</span>
        </div>

        {/* Drug groups */}
        {GROUPS_ORDER.map((group) => {
          const meds = IVF_MEDICATIONS.filter((m) => m.group === group);
          return (
            <Card key={group}>
              <CardHeader>
                <h3 className="font-semibold text-gray-900">
                  {MEDICATION_GROUPS[group]}
                </h3>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meds.map((med) => (
                  <label
                    key={med.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected.has(med.id)
                        ? "border-rose-300 bg-rose-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(med.id)}
                      onChange={() => toggle(med.id)}
                      className="mt-0.5 accent-rose-500"
                      aria-label={med.displayName}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {med.displayName}
                      </p>
                      <p className="text-xs text-gray-500">{med.description}</p>
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Free text fallback */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Other medications</h3>
          </CardHeader>
          <CardContent>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Enter additional medication names, one per line or comma-separated"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              aria-label="Additional medications"
            />
          </CardContent>
        </Card>

        {/* Zip code */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Your zip code (for pharmacy finder):
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 94305"
            className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Zip code for pharmacy finder"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={selectedCount === 0 && !freeText.trim()}
          className="w-full"
        >
          Check Coverage
          {selectedCount > 0 && ` (${selectedCount} medication${selectedCount !== 1 ? "s" : ""} selected)`}
        </Button>
      </form>
    </div>
  );
}
