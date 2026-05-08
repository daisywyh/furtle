import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildMapsUrl(zip: string): string {
  const query = encodeURIComponent(
    `specialty pharmacy fertility medications near ${zip}`
  );
  return `https://www.google.com/maps/search/${query}`;
}

export function buildMyChartMessage(params: {
  patientName: string;
  insurer: string;
  coveredDrugs: string[];
  notCoveredDrugs: string[];
  priorAuthDrugs: string[];
}): string {
  const { patientName, insurer, coveredDrugs, notCoveredDrugs, priorAuthDrugs } = params;

  const lines: string[] = [
    `Hi,`,
    ``,
    `I checked my ${insurer} coverage for my IVF medications and found the following:`,
    ``,
  ];

  coveredDrugs
    .filter((d) => !priorAuthDrugs.includes(d))
    .forEach((d) => lines.push(`- ${d}: Covered — no action needed`));

  priorAuthDrugs.forEach((d) =>
    lines.push(`- ${d}: Covered but requires prior authorization`)
  );

  notCoveredDrugs.forEach((d) =>
    lines.push(`- ${d}: Not covered (non-formulary) — prior authorization needed`)
  );

  if (notCoveredDrugs.length > 0 || priorAuthDrugs.length > 0) {
    lines.push(``);
    lines.push(`Could you please:`);
    const actionItems: string[] = [];
    const needAuth = [...new Set([...notCoveredDrugs, ...priorAuthDrugs])];
    if (needAuth.length > 0) {
      actionItems.push(
        `1. Submit a prior authorization request for: ${needAuth.join(", ")}`
      );
    }
    actionItems.push(
      `${actionItems.length + 1}. Consider prescribing generic equivalents where available`
    );
    actionItems.push(
      `${actionItems.length + 1}. Direct my prescriptions to a specialty fertility pharmacy if possible`
    );
    lines.push(...actionItems);
  }

  lines.push(``);
  lines.push(`Thank you,`);
  lines.push(patientName || `[Your name]`);

  return lines.join("\n");
}
