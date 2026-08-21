import type { Metadata } from "next";

// =============================================================================
// Whitepaper Layout
// =============================================================================

export const metadata: Metadata = {
  title: "Valence Whitepaper — NFC Tap-to-Pay Crypto-Fiat Gateway",
  description:
    "Technical whitepaper detailing Valence's architecture, security model, and settlement protocol for NFC-based crypto-fiat payments on Solana.",
};

export default function WhitepaperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
