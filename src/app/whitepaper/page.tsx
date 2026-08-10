import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";
import WhitepaperContent from "@/components/WhitepaperContent";

// =============================================================================
// Whitepaper — Valence Technical Architecture
//
// Server component for metadata. Content is handled by WhitepaperContent
// client component with EN/pt-BR language toggle.
// =============================================================================

export const metadata = {
  title: "Whitepaper — Valence | Rendey LLC",
  description:
    "Technical architecture documentation for the Valence platform: NFC, Fiat Onramps, Circle Wallets, and Solana settlement.",
};

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">R</span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              <span className="text-emerald-400">Valence</span>
            </span>
          </Link>
          <Link
            href="/terminal"
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            ← Back to Terminal
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Title */}
        <div className="mb-8">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-3">
            Technical Document
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Whitepaper — Valence
          </h1>
          <p className="text-sm text-gray-400">
            Version 1.0 · August 2026 · Rendey LLC
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-1 font-medium border border-emerald-500/20">
              Solana Devnet
            </span>
            <span className="text-[10px] rounded-full bg-blue-500/15 text-blue-400 px-2.5 py-1 font-medium border border-blue-500/20">
              MVP
            </span>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
          <h2 className="text-sm font-semibold mb-4">Table of Contents</h2>
          <ol className="space-y-2 text-sm text-gray-400">
            <li><a href="#resumo" className="hover:text-emerald-400 transition-colors">1. Executive Summary</a></li>
            <li><a href="#problema" className="hover:text-emerald-400 transition-colors">2. The Problem</a></li>
            <li><a href="#solucao" className="hover:text-emerald-400 transition-colors">3. Our Solution</a></li>
            <li><a href="#arquitetura" className="hover:text-emerald-400 transition-colors">4. System Architecture</a></li>
            <li><a href="#nfc" className="hover:text-emerald-400 transition-colors">5. NFC Initiation (Contactless)</a></li>
            <li><a href="#onramps" className="hover:text-emerald-400 transition-colors">6. Fiat Onramps: Transak & Stripe</a></li>
            <li><a href="#circle" className="hover:text-emerald-400 transition-colors">7. Circle Programmable Wallets</a></li>
            <li><a href="#solana" className="hover:text-emerald-400 transition-colors">8. Solana for Instant Settlement</a></li>
            <li><a href="#seguranca" className="hover:text-emerald-400 transition-colors">9. Security & Compliance</a></li>
            <li><a href="#roadmap" className="hover:text-emerald-400 transition-colors">10. Roadmap</a></li>
          </ol>
        </div>

        {/* Bilingual Content */}
        <WhitepaperContent />
      </main>

      <LandingFooter variant="subpage" />
    </div>
  );
}
