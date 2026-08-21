"use client";

/**
 * Valence — Merchant Dashboard (auth-gated).
 *
 * Shows the logged-in merchant's Solana Mainnet USDC balance (via Helius),
 * the Circle-provisioned wallet address, a Stripe Crypto Onramp top-up, and
 * the live Solana Pay POS checkout. Unauthenticated visitors are redirected
 * to /login.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { useToast } from "@/lib/toast";
import { BASE58_REGEX } from "@/lib/solana-pay-kit";
import SolanaPayCheckout from "@/components/SolanaPayCheckout";

interface Merchant {
  id: string;
  name: string;
  email: string;
  walletId: string | null;
  walletAddress: string | null;
  createdAt: number;
}

interface LedgerEntry {
  id: string;
  signature: string;
  amountUsdc: number;
  timestamp: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onrampLoading, setOnrampLoading] = useState(false);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [chargeAmount, setChargeAmount] = useState("25.00");

  // Fetch the authenticated merchant.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        const data = (await res.json()) as { merchant?: Merchant };
        if (!cancelled && data.merchant) {
          setMerchant(data.merchant);
        }
      } catch {
        toast("Failed to load session.", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, toast]);

  const fetchBalance = useCallback(
    async (address: string) => {
      setBalanceLoading(true);
      try {
        const res = await fetch(
          `/api/wallet/balance?address=${encodeURIComponent(address)}`
        );
        const data = (await res.json()) as { usdc?: number };
        setBalance(typeof data.usdc === "number" ? data.usdc : 0);
      } catch {
        toast("Could not fetch USDC balance.", "error");
      } finally {
        setBalanceLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (merchant?.walletAddress) {
      fetchBalance(merchant.walletAddress);
    }
  }, [merchant?.walletAddress, fetchBalance]);

  const handleCopy = useCallback(() => {
    if (!merchant?.walletAddress) return;
    navigator.clipboard.writeText(merchant.walletAddress).then(() => {
      setCopied(true);
      toast("Wallet address copied.", "success", 2200);
      setTimeout(() => setCopied(false), 1_800);
    });
  }, [merchant?.walletAddress, toast]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast("Signed out.", "info");
    router.push("/login");
    router.refresh();
  }, [router, toast]);

  const handleOnramp = useCallback(async () => {
    if (!merchant?.walletAddress) {
      toast("No wallet address on file.", "error");
      return;
    }
    setOnrampLoading(true);
    try {
      const res = await fetch("/api/stripe/onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: merchant.walletAddress,
          amountUsd: 50,
        }),
      });
      const data = (await res.json()) as {
        url?: string;
        mock?: boolean;
        message?: string;
      };
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        toast("Stripe Checkout opened — complete the USDC purchase.", "info");
      } else {
        toast(
          data.message ??
            "Crypto Onramp not enabled on this Stripe account (mock session).",
          "info"
        );
      }
    } catch {
      toast("Failed to start Stripe onramp.", "error");
    } finally {
      setOnrampLoading(false);
    }
  }, [merchant?.walletAddress, toast]);

  const addLedgerEntry = useCallback(
    (entry: Omit<LedgerEntry, "id" | "timestamp">) => {
      setLedger((prev) => [
        { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
        ...prev,
      ]);
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!merchant) return null;

  const validWallet =
    merchant.walletAddress != null && BASE58_REGEX.test(merchant.walletAddress);
  const chargeNum = parseFloat(chargeAmount) || 0;

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
                    Settlement wallet · Solana Mainnet
                  </p>
                </div>
                <h2 className="text-xl font-bold tracking-tight truncate">
                  {merchant.name}
                </h2>
                <div className="mt-3 flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                  <p className="flex-1 text-[11px] font-mono text-gray-300 truncate">
                    {merchant.walletAddress ?? "—"}
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
                      href={`https://solscan.io/account/${merchant.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-cyan-300 transition-colors"
                      aria-label="View on Solscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
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
                  <span className="text-sm font-semibold text-gray-400">USDC</span>
                </div>
                <p className="text-[10px] text-gray-600 mt-1.5">
                  Live via Helius RPC · mint EPjF…TDt1v
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
                Stripe Crypto Onramp → your wallet
              </p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-[11px] text-gray-400">Destination</p>
                <p className="text-[11px] font-mono text-gray-300 mt-1 break-all">
                  {merchant.walletAddress ?? "—"}
                </p>
                <p className="text-[10px] text-gray-600 mt-2">
                  USDC · Solana Mainnet · non-custodial settlement
                </p>
              </div>
              <button
                onClick={handleOnramp}
                disabled={onrampLoading || !validWallet}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#635bff] to-[#7a73ff] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {onrampLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating session…
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Buy $50 USDC via Stripe
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-600 text-center">
                Card → USDC in under 5s. If Crypto Onramp isn't enabled on
                your Stripe account, a mock session is returned.
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
              <SolanaPayCheckout
                recipient={merchant.walletAddress as string}
                amountUsdc={chargeNum}
                onConfirmed={({ signature, amountUsdc }) =>
                  addLedgerEntry({ signature, amountUsdc })
                }
              />
            ) : (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-5 text-xs text-amber-200">
                No valid wallet address on file — cannot start Solana Pay
                checkout.
              </div>
            )}
          </section>
        </div>

        {/* Settlement Ledger */}
        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
            <h3 className="text-sm font-semibold">Recent Settlements</h3>
            <p className="text-[10px] text-gray-500">
              Confirmed Solana Pay receipts this session
            </p>
          </div>
          {ledger.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-500">
                No settlements yet — generate a Solana Pay QR to accept your
                first payment.
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
                  {ledger.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="px-6 py-3 text-[11px] text-gray-400">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-xs font-semibold text-emerald-300">
                          {entry.amountUsdc.toFixed(2)} USDC
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <a
                          href={`https://solscan.io/tx/${entry.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5"
                        >
                          {entry.signature.slice(0, 14)}…{entry.signature.slice(-6)}
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
            Valence · Zero-custody USDC settlement on Solana Mainnet ·
            valence.rendey.store
          </p>
        </footer>
      </main>
    </div>
  );
}
