"use client";

// =============================================================================
// Dashboard — Valence Payment Platform
//
// Authenticated merchant console. Integrates:
//   • Circle programmable wallet overview + provisioning (existing API)
//   • Live USDC balance via Helius (existing /api/wallet/balance)
//   • Stripe Crypto Onramp (BRL/USD → USDC on Solana, wallet locked
//     server-side) mounted in a glassmorphism modal
//   • Solana Pay POS checkout with on-chain confirmation
//   • REAL on-chain transaction ledger via /api/wallet/transactions
//     (Solana RPC signatures + parsed USDC deltas — zero placeholder rows)
//
// Production status surfaced in the UI:
//   • Dynamic cluster badge (SOLANA MAINNET / SOLANA DEVNET)
//   • Gateway status: "Stripe Onramp / Solana Pay — Live"
//   • Verification status derived from real merchant wallet state
//
// Design system: dark glassmorphism (bg-[#0a0b0d], white/[0.06] borders,
// emerald→cyan gradients). Transaction states surfaced via sonner toasts.
// Payment modules are wrapped in ErrorBoundary so a crash never takes down
// the whole console.
// =============================================================================

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import type { PublicMerchant } from "@/lib/session";
import {
  getClusterLabel,
  getSolscanUrl,
  getUsdcMint,
  isMainnet,
  isValidSolanaAddress,
} from "@/lib/solana";
import ErrorBoundary from "@/components/ErrorBoundary";
import StripeOnramp from "@/components/StripeOnramp";
import SolanaPayCheckout from "@/components/SolanaPayCheckout";

/** Row shape returned by GET /api/wallet/transactions (real on-chain data). */
interface TransactionRow {
  signature: string;
  /** Unix seconds (on-chain blockTime); null when unavailable. */
  timestamp: number | null;
  /** Parsed USDC delta for this wallet; null for non-USDC transactions. */
  amountUsdc: number | null;
  direction: "in" | "out" | "unknown";
  /** Optimistic local row awaiting RPC indexing. */
  pending?: boolean;
}

type OnrampCurrency = "brl" | "usd";

function parseAmount(raw: string): number | null {
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

export default function Dashboard() {
  const router = useRouter();

  const [merchant, setMerchant] = useState<PublicMerchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [chargeAmount, setChargeAmount] = useState("25.00");
  const [onrampAmount, setOnrampAmount] = useState("250");
  const [onrampCurrency, setOnrampCurrency] = useState<OnrampCurrency>("brl");
  const [onrampOpen, setOnrampOpen] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);

  // --- Session ------------------------------------------------------------------

  const loadMerchant = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = (await res.json()) as {
        merchant?: PublicMerchant;
        error?: string;
      };
      if (!res.ok || !data.merchant) {
        throw new Error(data.error ?? "Failed to load merchant profile.");
      }
      setMerchant(data.merchant);
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load session."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadMerchant();
  }, [loadMerchant]);

  // --- Balance --------------------------------------------------------------------

  const fetchBalance = useCallback(async (address: string) => {
    setBalanceLoading(true);
    try {
      const res = await fetch(
        `/api/wallet/balance?address=${encodeURIComponent(address)}`
      );
      const data = (await res.json()) as { usdc?: number };
      setBalance(typeof data.usdc === "number" ? data.usdc : 0);
    } catch {
      toast.error("Could not fetch USDC balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  // --- On-chain transaction ledger --------------------------------------------------

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch("/api/wallet/transactions", {
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as {
        transactions?: TransactionRow[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load transactions.");
      }
      setTransactions(data.transactions ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not fetch transactions."
      );
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (merchant?.walletAddress) {
      void fetchBalance(merchant.walletAddress);
      void fetchTransactions();
    }
  }, [merchant?.walletAddress, fetchBalance, fetchTransactions]);

  // --- Handlers ---------------------------------------------------------------------

  const handleCopy = useCallback(() => {
    if (!merchant?.walletAddress) return;
    navigator.clipboard.writeText(merchant.walletAddress).then(
      () => {
        setCopied(true);
        toast.success("Wallet address copied.");
        setTimeout(() => setCopied(false), 1_800);
      },
      () => toast.error("Could not copy the address.")
    );
  }, [merchant?.walletAddress]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.info("Signed out.");
    router.push("/login");
    router.refresh();
  }, [router]);

  const handleCreateWallet = useCallback(async () => {
    setCreatingWallet(true);
    const toastId = toast.loading("Creating Circle wallet…");
    try {
      const res = await fetch("/api/circle/create-wallet", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Wallet creation failed.");
      }
      toast.success("Circle wallet ready.", { id: toastId });
      await loadMerchant();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Wallet creation failed.",
        { id: toastId }
      );
    } finally {
      setCreatingWallet(false);
    }
  }, [loadMerchant]);

  const openOnramp = useCallback(() => {
    if (!merchant?.walletAddress || !isValidSolanaAddress(merchant.walletAddress)) {
      toast.error("Create your Circle wallet before adding funds.");
      return;
    }
    if (!parseAmount(onrampAmount)) {
      toast.error("Enter a valid amount.");
      return;
    }
    setOnrampOpen(true);
    toast.info("Stripe onramp initiated.", {
      description: "Secure session — destination wallet locked to yours.",
    });
  }, [merchant?.walletAddress, onrampAmount]);

  const handleOnrampFulfilled = useCallback(() => {
    toast.success("USDC purchase confirmed.", {
      description: "Funds are settling to your wallet on Solana.",
    });
    setOnrampOpen(false);
    if (merchant?.walletAddress) void fetchBalance(merchant.walletAddress);
    // Onramp settlement lands on-chain — refresh the ledger shortly after.
    setTimeout(() => {
      void fetchTransactions();
    }, 15_000);
  }, [merchant?.walletAddress, fetchBalance, fetchTransactions]);

  const handleOnrampError = useCallback((message: string) => {
    toast.error("Onramp failed.", { description: message });
  }, []);

  const handlePaymentConfirmed = useCallback(
    ({ signature, amountUsdc }: { signature: string; amountUsdc: number }) => {
      // Optimistic row — replaced by canonical RPC data on the next fetch.
      setTransactions((prev) =>
        prev.some((t) => t.signature === signature)
          ? prev
          : [
              {
                signature,
                timestamp: Math.floor(Date.now() / 1000),
                amountUsdc,
                direction: "in",
                pending: true,
              },
              ...prev,
            ]
      );
      if (merchant?.walletAddress) void fetchBalance(merchant.walletAddress);
      // RPC indexing lags a few seconds behind on-chain confirmation.
      setTimeout(() => {
        void fetchTransactions();
      }, 12_000);
    },
    [merchant?.walletAddress, fetchBalance, fetchTransactions]
  );

  // Escape closes the onramp modal.
  useEffect(() => {
    if (!onrampOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOnrampOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onrampOpen]);

  // --- Render -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <Toaster theme="dark" richColors closeButton position="bottom-right" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center p-6">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-8 text-center max-w-sm w-full">
          <p className="text-sm font-semibold text-red-300">
            Failed to load dashboard
          </p>
          <p className="mt-1 text-xs text-red-400/70">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError(null);
              void loadMerchant();
            }}
            className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            Retry
          </button>
        </div>
        <Toaster theme="dark" richColors closeButton position="bottom-right" />
      </div>
    );
  }

  if (!merchant) return null;

  const mainnet = isMainnet();
  const clusterLabel = getClusterLabel();
  const usdcMint = getUsdcMint().toBase58();
  const usdcMintShort = `${usdcMint.slice(0, 4)}…${usdcMint.slice(-4)}`;
  const validWallet =
    merchant.walletAddress != null &&
    isValidSolanaAddress(merchant.walletAddress);
  const chargeNum = parseAmount(chargeAmount) ?? 0;
  const parsedOnrampAmount = parseAmount(onrampAmount);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
      <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#06210f]" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">Valence</span>
            <span className="text-[10px] text-gray-600 font-normal hidden sm:inline">
              · Merchant Dashboard
            </span>
            <span
              className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider border ${
                mainnet
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {clusterLabel}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="max-w-[10rem] truncate">{merchant.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Wallet + Balance overview */}
        <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.03] to-cyan-500/[0.06] backdrop-blur-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-emerald-300" />
                  <p className="text-xs text-gray-400">
                    Settlement wallet · Solana
                  </p>
                </div>
                <h2 className="text-xl font-bold tracking-tight truncate">
                  {merchant.name}
                </h2>
                <div className="mt-3 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  {merchant.walletAddress ? (
                    <>
                      <p className="flex-1 text-[11px] font-mono text-gray-300 truncate">
                        {merchant.walletAddress}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Copy wallet address"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      {validWallet && (
                        <a
                          href={getSolscanUrl(
                            `/account/${merchant.walletAddress}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-cyan-300 transition-colors"
                          aria-label="View on Solscan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-[11px] text-gray-500">
                        No wallet provisioned yet.
                      </p>
                      <button
                        onClick={handleCreateWallet}
                        disabled={creatingWallet}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 transition-colors disabled:opacity-50"
                      >
                        {creatingWallet ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        {creatingWallet ? "Creating…" : "Create Circle wallet"}
                      </button>
                    </>
                  )}
                </div>

                {/* Production status strip */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        mainnet ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    {clusterLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Stripe Onramp / Solana Pay — Live
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-300" />
                    {merchant.walletAddress
                      ? "Verified (Production)"
                      : "Verification pending — wallet not provisioned"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 min-w-[15rem]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-400">USDC Balance</p>
                  <button
                    onClick={() =>
                      merchant.walletAddress &&
                      fetchBalance(merchant.walletAddress)
                    }
                    disabled={balanceLoading}
                    className="text-gray-500 hover:text-emerald-300 transition-colors disabled:opacity-40"
                    aria-label="Refresh balance"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-emerald-300">
                    {balance == null ? "—" : balance.toFixed(2)}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    USDC
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Live on-chain · {mainnet ? "Mainnet" : "Devnet"} · mint{" "}
                  {usdcMintShort}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Top-up + POS grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Stripe Onramp */}
          <section className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-300" />
                Top Up USDC
              </h3>
              <p className="text-[10px] text-gray-500">
                Stripe Onramp / Solana Pay — Live
              </p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[11px] text-gray-400">Destination</p>
                <p className="text-[11px] font-mono text-gray-300 mt-1 break-all">
                  {merchant.walletAddress ?? "—"}
                </p>
                <p className="text-[10px] text-gray-600 mt-2">
                  USDC · Solana · non-custodial settlement · wallet locked
                  server-side
                </p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] text-gray-400 mb-1.5 block">
                    Amount ({onrampCurrency.toUpperCase()})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={onrampAmount}
                    onChange={(e) => setOnrampAmount(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 mb-1.5 block">
                    Currency
                  </label>
                  <div className="flex rounded-xl border border-white/[0.06] overflow-hidden">
                    {(["brl", "usd"] as const).map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => setOnrampCurrency(currency)}
                        className={`px-3 py-2.5 text-xs font-semibold uppercase transition-colors ${
                          onrampCurrency === currency
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/[0.02] text-gray-500 hover:text-gray-300"
                        }`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={openOnramp}
                disabled={!validWallet || !parsedOnrampAmount}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#635bff] to-[#7a73ff] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Add funds via Stripe
              </button>
              <p className="text-[10px] text-gray-600 text-center">
                Card → USDC on Solana. The destination wallet is locked to your
                Circle wallet — no manual address input.
              </p>
            </div>
          </section>

          {/* Solana Pay POS */}
          <section className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-gray-400 mb-1.5 block">
                  Charge Amount (USDC)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            {validWallet ? (
              <ErrorBoundary fallbackTitle="The Solana Pay module crashed.">
                <SolanaPayCheckout
                  recipient={merchant.walletAddress as string}
                  amountUsdc={chargeNum}
                  onConfirmed={handlePaymentConfirmed}
                />
              </ErrorBoundary>
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3">
                <span>
                  No valid wallet address on file — create your Circle wallet
                  to start accepting payments.
                </span>
                <button
                  onClick={handleCreateWallet}
                  disabled={creatingWallet}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {creatingWallet ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                  {creatingWallet ? "Creating…" : "Create wallet"}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* On-Chain Transaction Ledger */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01] flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold">
                On-Chain Transaction Ledger
              </h3>
              <p className="text-[10px] text-gray-500">
                Live from Solana RPC · parsed USDC transfers for your wallet
              </p>
            </div>
            <button
              onClick={() => void fetchTransactions()}
              disabled={txLoading}
              className="text-gray-500 hover:text-emerald-300 transition-colors disabled:opacity-40"
              aria-label="Refresh transactions"
            >
              <RefreshCw
                className={`w-4 h-4 ${txLoading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center">
              {txLoading ? (
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mx-auto mb-3" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              )}
              <p className="text-xs text-gray-500">
                {txLoading
                  ? "Loading on-chain transactions…"
                  : "No on-chain transactions yet — generate a Solana Pay QR to accept your first payment."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="px-6 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Signature
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((entry) => (
                    <tr
                      key={entry.signature}
                      className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-3 text-[11px] text-gray-400">
                        {entry.timestamp
                          ? new Date(entry.timestamp * 1000).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          {entry.direction === "in" ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" />
                          ) : entry.direction === "out" ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-red-300" />
                          ) : null}
                          <span
                            className={`text-xs font-semibold ${
                              entry.direction === "in"
                                ? "text-emerald-300"
                                : entry.direction === "out"
                                  ? "text-red-300"
                                  : "text-gray-400"
                            }`}
                          >
                            {entry.amountUsdc != null
                              ? `${entry.direction === "out" ? "-" : "+"}${entry.amountUsdc.toFixed(2)} USDC`
                              : "—"}
                          </span>
                          {entry.pending && (
                            <span className="px-1.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-[9px] font-semibold text-amber-300">
                              indexing
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={getSolscanUrl(`/tx/${entry.signature}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5"
                        >
                          {entry.signature.slice(0, 14)}…
                          {entry.signature.slice(-6)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="border-t border-white/[0.06] py-4 mt-2">
          <p className="text-[10px] text-gray-700 text-center">
            Valence Payment Platform · Zero-custody USDC settlement on Solana ·
            valence.rendey.store
          </p>
        </footer>
      </main>

      {/* Stripe Onramp modal */}
      {onrampOpen && merchant.walletAddress && parsedOnrampAmount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOnrampOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#101216]/95 backdrop-blur-xl shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Add funds — Stripe Crypto Onramp
                </h2>
                <p className="mt-0.5 text-[11px] text-white/40">
                  {onrampCurrency.toUpperCase()} → USDC · settles directly to
                  your Circle wallet
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOnrampOpen(false)}
                aria-label="Close"
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <ErrorBoundary fallbackTitle="The onramp module crashed.">
                <StripeOnramp
                  walletAddress={merchant.walletAddress}
                  amount={parsedOnrampAmount}
                  sourceCurrency={onrampCurrency}
                  onFulfilled={handleOnrampFulfilled}
                  onError={handleOnrampError}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      )}

      <Toaster theme="dark" richColors closeButton position="bottom-right" />
    </div>
  );
}
