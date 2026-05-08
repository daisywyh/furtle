import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Furtle — IVF Medication Coverage Finder",
  description:
    "Check your insurance formulary coverage for fertility medications, find specialty pharmacies, and get paperwork ready.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">F</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Furtle</h1>
              <p className="text-xs text-gray-500">
                IVF medication coverage finder
              </p>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <p className="text-xs text-gray-400 text-center">
              This tool provides general coverage information based on your
              plan&apos;s formulary. Actual coverage may vary. Verify with your
              insurance and provider before making decisions.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
