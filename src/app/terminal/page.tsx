import Dashboard from "@/components/Dashboard";

// =============================================================================
// Terminal Page — Rendey Payment MVP
//
// This page wraps the Dashboard component at /terminal.
// The landing page (/) now serves as the entry point with CTAs.
// =============================================================================

export const metadata = {
  title: "Valence Terminal — Carteira Cripto-Fiat",
  description:
    "Terminal de pagamento Rendey. Deposite via PIX, envie e receba SOL/USDC na Solana.",
};

export default function TerminalPage() {
  return <Dashboard />;
}
