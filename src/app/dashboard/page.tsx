import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

// =============================================================================
// Merchant Dashboard — Valence Payment Platform
//
// Thin server wrapper: exports SEO metadata and renders the client-side
// merchant console (Circle wallet overview, Stripe Crypto Onramp top-up,
// Solana Pay POS, settlement ledger). Auth is enforced client-side via
// /api/auth/me with redirect to /login.
//
// `force-dynamic` opts the page out of static prerendering: the console is
// authenticated (cookie session) and uses runtime-only browser APIs, so it
// must never be evaluated during the build's static generation pass.
// =============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard — Valence Payment Platform",
  description:
    "Merchant console for the Valence Payment Platform: Circle programmable wallet balances, Stripe Crypto Onramp top-ups, and Solana Pay point-of-sale with real-time on-chain settlement.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
