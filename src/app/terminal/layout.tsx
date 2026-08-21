import type { Metadata } from "next";

// =============================================================================
// Terminal Layout — Minimal wrapper for the POS Terminal route
// =============================================================================

export const metadata: Metadata = {
  title: "Valence POS Terminal — NFC Tap-to-Pay",
  description: "Mobile NFC payment terminal for instant crypto-fiat settlement on Solana.",
};

export default function TerminalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
