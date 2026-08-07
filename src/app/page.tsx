import Dashboard from "@/components/Dashboard";

// =============================================================================
// Home Page — Rendey Payment MVP
//
// Clean entry point that renders the Dashboard component.
// The Dashboard handles all wallet, deposit, and transfer functionality.
// =============================================================================

export const metadata = {
  title: "Rendey — Crypto-Fiat Payment MVP",
  description:
    "Rendey is a crypto-fiat payment platform for Brazil. Deposit via PIX, send and receive SOL/USDC on Solana.",
};

export default function Home() {
  return <Dashboard />;
}
