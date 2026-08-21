import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

// =============================================================================
// Merchant Dashboard — Valence Payment Platform
//
// Thin server wrapper: exports SEO metadata and renders the client-side
// merchant console (Circle wallet overview, Stripe Crypto Onramp top-up,
// Solana Pay POS, settlement ledger). Auth is enforced client-side via
// /api/auth/me with redirect to /login.
// =============================================================================

export const metadata: Metadata = {
  title: "Dashboard — Valence Payment Platform",
  description:
    "Merchant console for the Valence Payment Platform: Circle programmable wallet balances, Stripe Crypto Onramp top-ups, and Solana Pay point-of-sale with real-time on-chain settlement.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
