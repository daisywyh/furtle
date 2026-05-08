"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PatientInfo {
  patientName: string;
  dateOfBirth: string;
  memberId: string;
  groupNumber: string;
  drugName: string;
  diagnosis: string;
  providerName: string;
}

const EMPTY_FORM: PatientInfo = {
  patientName: "",
  dateOfBirth: "",
  memberId: "",
  groupNumber: "",
  drugName: "",
  diagnosis: "Infertility / IVF Treatment",
  providerName: "",
};

export default function PaperworkPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <PaperworkContent />
    </Suspense>
  );
}

function PaperworkContent() {
  const searchParams = useSearchParams();
  const prefilledDrug = searchParams.get("drug") || "";
  const [form, setForm] = useState<PatientInfo>({
    ...EMPTY_FORM,
    drugName: prefilledDrug,
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  function updateField(field: keyof PatientInfo, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function generatePdf() {
    setGenerating(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

      // Load the Aetna prior auth template
      const templateRes = await fetch(
        "/templates/precertification-request-for-prescription-drugs.pdf"
      );
      if (!templateRes.ok) {
        throw new Error("Template not found");
      }
      const templateBytes = await templateRes.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Try to fill form fields (AcroForm), fall back to text overlay
      const acroForm = pdfDoc.getForm();
      const fields = acroForm.getFields();

      if (fields.length > 0) {
        // Fillable PDF — try to match field names
        console.log(
          "Form fields found:",
          fields.map((f) => f.getName())
        );
        tryFillAcroForm(acroForm, form);
      } else {
        // Flat PDF — overlay text on first page
        const pages = pdfDoc.getPages();
        const page = pages[0];
        const { height } = page.getSize();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const today = new Date().toLocaleDateString("en-US");

        const overlayText = [
          { text: form.patientName, x: 150, y: height - 195 },
          { text: form.dateOfBirth, x: 400, y: height - 195 },
          { text: form.memberId, x: 150, y: height - 225 },
          { text: form.groupNumber, x: 400, y: height - 225 },
          { text: form.drugName, x: 150, y: height - 290 },
          { text: form.diagnosis, x: 150, y: height - 320 },
          { text: today, x: 150, y: height - 160 },
        ];

        for (const { text, x, y } of overlayText) {
          if (text) {
            page.drawText(text, {
              x,
              y,
              size: 10,
              font: helvetica,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aetna-prior-auth-${(form.drugName || "request").replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setGenerated(true);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert(
        "PDF generation failed. The template may not be available. Check docs/debugging.md for details."
      );
    } finally {
      setGenerating(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function tryFillAcroForm(acroForm: any, data: PatientInfo) {
    const fieldMap: Record<string, string> = {
      "patient name": data.patientName,
      "member id": data.memberId,
      "group number": data.groupNumber,
      "date of birth": data.dateOfBirth,
      drug: data.drugName,
      medication: data.drugName,
      diagnosis: data.diagnosis,
      physician: data.providerName,
      provider: data.providerName,
    };

    for (const field of acroForm.getFields()) {
      const name = field.getName().toLowerCase();
      for (const [key, value] of Object.entries(fieldMap)) {
        if (name.includes(key) && value) {
          try {
            field.setText(value);
          } catch {
            // Field may not be a text field
          }
        }
      }
    }
  }

  const isReady = form.patientName && form.memberId && form.drugName;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Prior Authorization Paperwork
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Generate a pre-filled Aetna prior authorization form for
            non-formulary medications
          </p>
        </div>
        <Link href="/results">
          <Button variant="outline" size="sm">
            ← Back to results
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Patient Information</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            This information stays in your browser and is never sent to any
            server.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Patient Name *"
              value={form.patientName}
              onChange={(v) => updateField("patientName", v)}
              placeholder="Full legal name"
            />
            <Field
              label="Date of Birth *"
              value={form.dateOfBirth}
              onChange={(v) => updateField("dateOfBirth", v)}
              placeholder="MM/DD/YYYY"
            />
            <Field
              label="Aetna Member ID *"
              value={form.memberId}
              onChange={(v) => updateField("memberId", v)}
              placeholder="Found on your insurance card"
            />
            <Field
              label="Group Number"
              value={form.groupNumber}
              onChange={(v) => updateField("groupNumber", v)}
              placeholder="Found on your insurance card"
            />
            <Field
              label="Medication Name *"
              value={form.drugName}
              onChange={(v) => updateField("drugName", v)}
              placeholder="e.g. Gonal-F"
            />
            <Field
              label="Diagnosis"
              value={form.diagnosis}
              onChange={(v) => updateField("diagnosis", v)}
              placeholder="e.g. Infertility / IVF Treatment"
            />
            <Field
              label="Prescribing Provider Name"
              value={form.providerName}
              onChange={(v) => updateField("providerName", v)}
              placeholder="Dr. Last Name"
              className="sm:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={generatePdf}
          size="lg"
          disabled={!isReady || generating}
          className="w-full"
        >
          {generating ? "Generating PDF..." : "Download Pre-filled Prior Auth Form"}
        </Button>

        {generated && (
          <p className="text-sm text-green-600 text-center">
            PDF downloaded. Print or email it to your prescribing doctor. Ask
            them to complete the clinical justification section and submit to
            Aetna.
          </p>
        )}
      </div>

      <Card className="bg-amber-50 border-amber-100">
        <CardContent className="pt-4">
          <h4 className="font-medium text-amber-900 text-sm mb-2">
            What to do with this form
          </h4>
          <ol className="space-y-1.5 text-sm text-amber-800">
            <li>1. Download and print the pre-filled form</li>
            <li>
              2. Bring it to your next appointment or send it to your
              doctor&apos;s office
            </li>
            <li>
              3. Ask your doctor to complete the{" "}
              <strong>clinical justification</strong> section and submit to
              Aetna
            </li>
            <li>4. Aetna typically reviews prior auth requests within 3–5 business days</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
      />
    </div>
  );
}
