import type { Metadata } from "next";
import LandingClient from "@/components/LandingClient";

// =============================================================================
// Landing Page — Valence by Rendey
//
// Server wrapper that exports SEO metadata and renders the interactive
// client-side landing experience (hero, stats, features, comparison,
// security, FAQ, CTA).
// =============================================================================

export const metadata: Metadata = {
  title: "Valence — NFC Tap-to-Pay Crypto-Fiat Gateway",
  description:
    "Institutional-grade mobile NFC payment gateway bridging traditional fiat (PIX/Stripe) with instant USDC settlement on Solana through non-custodial Circle programmable wallets.",
  keywords: [
    "NFC payments",
    "crypto payment gateway",
    "PIX to USDC",
    "Solana payments",
    "Circle programmable wallets",
    "Stripe crypto onramp",
    "Transak",
    "Brazil fintech",
  ],
  openGraph: {
    title: "Valence — Tap-to-Pay. Settled in Seconds.",
    description:
      "Turn any smartphone into an NFC terminal. Fiat in via PIX and cards, USDC out on Solana — in under 10 seconds, non-custodial.",
    url: "https://valence.rendey.store",
    siteName: "Valence by Rendey",
    type: "website",
  },
};

export default function LandingPage() {
  return <LandingClient />;
}
