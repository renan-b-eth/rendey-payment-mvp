// =============================================================================
// LandingFooter — Shared footer for Landing, Whitepaper, Termos, Privacidade
// =============================================================================

import Link from "next/link";

interface LandingFooterProps {
  /** Optional variant for different page contexts */
  variant?: "landing" | "subpage";
}

export default function LandingFooter({ variant = "landing" }: LandingFooterProps) {
  return (
    <footer className="border-t border-white/[0.06] py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[8px] font-bold">R</span>
            </div>
            <span className="text-sm font-bold tracking-tight">
              <span className="text-emerald-400">Rendey</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-500">
            <Link
              href="/termos"
              className="hover:text-gray-300 transition-colors"
            >
              Termos de Uso
            </Link>
            <span className="text-gray-700">·</span>
            <Link
              href="/privacidade"
              className="hover:text-gray-300 transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-700">·</span>
            <Link
              href="/whitepaper"
              className="hover:text-gray-300 transition-colors"
            >
              Whitepaper
            </Link>
          </div>

          <p className="text-[10px] text-gray-600">
            © 2026 Rendey LLC · Circle · Stripe · Solana
          </p>
        </div>
      </div>
    </footer>
  );
}
