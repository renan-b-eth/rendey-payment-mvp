"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  CheckCircle2,
  Wallet,
  ArrowDownToLine,
  Send,
  RefreshCw,
  Zap,
  Shield,
  ExternalLink,
} from "lucide-react";
import TransakMockModal from "./TransakMockModal";

// =============================================================================
// Dashboard — Production-Ready Dark Mode Web3 UI
// =============================================================================

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

interface WalletInfo {
  id: string;
  address: string;
  chain: string;
  currency: string;
  state: string;
}

export default function Dashboard() {
  // ---- Wallet state --------------------------------------------------------
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // ---- Transak modal state -------------------------------------------------
  const [transakOpen, setTransakOpen] = useState(false);

  // ---- Solana Pay state ----------------------------------------------------
  const [payAmount, setPayAmount] = useState<string>("1");
  const [payTxHash, setPayTxHash] = useState<string | null>(null);
  const [paySending, setPaySending] = useState(false);

  // ==========================================================================
  // 1. Generate Wallet
  // ==========================================================================
  const handleGenerateWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/wallet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@rendey-mvp.com" }),
      });
      const data = await res.json();

      if (data.success && data.wallet) {
        setWallet(data.wallet);
        // Auto-fetch balance after wallet generation
        setTimeout(() => fetchBalance(data.wallet.address), 500);
      } else {
        setWalletError(data.error || "Failed to generate wallet.");
      }
    } catch (err) {
      console.error("Wallet generation error:", err);
      setWalletError("Network error. Check your connection.");
    } finally {
      setWalletLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // 2. Fetch SOL Balance from Devnet
  // ==========================================================================
  const fetchBalance = useCallback(async (address?: string) => {
    const addr = address || wallet?.address;
    if (!addr) return;
    setBalanceLoading(true);
    try {
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const pubkey = new PublicKey(addr);
      const lamports = await connection.getBalance(pubkey);
      setSolBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error("Balance fetch error:", err);
      // On error, keep the existing balance or set to 0
      if (solBalance === null) setSolBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet?.address, solBalance]);

  // Auto-fetch balance when wallet is set
  useEffect(() => {
    if (wallet?.address) {
      fetchBalance(wallet.address);
    }
  }, [wallet?.address, fetchBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // 3. Copy wallet address to clipboard
  // ==========================================================================
  const handleCopyAddress = useCallback(() => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [wallet?.address]);

  // ==========================================================================
  // 4. Transak Deposit — opens mock modal
  // ==========================================================================
  const handleTransakDeposit = useCallback(() => {
    if (!wallet?.address) {
      alert("Generate a wallet first.");
      return;
    }
    setTransakOpen(true);
  }, [wallet?.address]);

  const handleTransakSuccess = useCallback(
    (usdcAmount: number) => {
      setUsdcBalance((prev) => prev + usdcAmount);
      setTransakOpen(false);
      // Re-fetch SOL balance in case anything changed on-chain
      fetchBalance();
    },
    [fetchBalance]
  );

  // ==========================================================================
  // 5. Stripe Crypto Onramp
  // ==========================================================================
  const handleStripeDeposit = useCallback(async () => {
    if (!wallet?.address) {
      alert("Generate a wallet first.");
      return;
    }

    try {
      const res = await fetch("/api/stripe/onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.address, amountUsd: 50 }),
      });
      const data = await res.json();

      if (data.mock) {
        // Mock mode — simulate a successful deposit for the demo
        alert(
          `${data.message}\n\nFor this demo, we'll simulate a $50 USDC deposit.`
        );
        setUsdcBalance((prev) => prev + 50);
      } else if (data.clientSecret) {
        // Real Stripe flow — would use stripe.confirmCryptoPayment(clientSecret)
        alert(
          `Stripe Crypto Onramp session created!\nSession: ${data.sessionId}\n\n` +
            `In production, this opens the Stripe Crypto Onramp UI.`
        );
      }
    } catch (err) {
      console.error("Stripe onramp error:", err);
      alert("Stripe integration error. Check console.");
    }
  }, [wallet?.address]);

  // ==========================================================================
  // 6. Solana Pay — simulate sending SOL/USDC
  // ==========================================================================
  const handleSendPayment = useCallback(async () => {
    if (!wallet?.address) {
      alert("Generate a wallet first.");
      return;
    }
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    setPaySending(true);

    try {
      // In production, this would use @solana/web3.js to build and sign a
      // transfer transaction via a wallet adapter (Phantom, Solflare, etc.).
      //
      // For the MVP demo, we simulate the transaction with a mock hash.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockHash = `Tx${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      setPayTxHash(mockHash);

      // Simulate the balance change
      setSolBalance((prev) => Math.max(0, (prev ?? 0) - amount * 0.00001));
    } catch (err) {
      console.error("Send payment error:", err);
      alert("Transaction failed.");
    } finally {
      setPaySending(false);
    }
  }, [wallet?.address, payAmount]);

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <>
      <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
        {/* ---- Header ---- */}
        <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                <span className="text-emerald-400">Rendey</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-1 font-medium border border-emerald-500/20">
                SOLANA DEVNET
              </span>
              <span className="text-[10px] rounded-full bg-blue-500/15 text-blue-400 px-2.5 py-1 font-medium border border-blue-500/20 flex items-center gap-1">
                <Shield size={10} /> MVP
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* ================================================================ */}
          {/* CARD 1 — Wallet Status                                           */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Card header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold">Your Wallet</h2>
              </div>
              {wallet && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchBalance()}
                    disabled={balanceLoading}
                    className="text-gray-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Refresh balance"
                  >
                    <RefreshCw
                      size={14}
                      className={balanceLoading ? "animate-spin" : ""}
                    />
                  </button>
                  <a
                    href={`https://explorer.solana.com/address/${wallet.address}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-white transition-colors"
                    title="View on Explorer"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>

            <div className="p-6">
              {wallet ? (
                <div className="space-y-4">
                  {/* Address */}
                  <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                    <code className="text-xs text-gray-300 font-mono break-all flex-1">
                      {wallet.address}
                    </code>
                    <button
                      onClick={handleCopyAddress}
                      className="text-gray-500 hover:text-white transition-colors shrink-0"
                      title="Copy address"
                    >
                      {copied ? (
                        <CheckCircle2 size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>

                  {/* Balances */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        SOL Balance
                      </p>
                      <p className="text-xl font-bold text-white">
                        {balanceLoading ? (
                          <span className="animate-pulse">—</span>
                        ) : solBalance !== null ? (
                          solBalance.toFixed(4)
                        ) : (
                          "0.0000"
                        )}
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          SOL
                        </span>
                      </p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                        USDC Balance
                      </p>
                      <p className="text-xl font-bold text-white">
                        {usdcBalance.toFixed(2)}
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          USDC
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <button
                    onClick={handleGenerateWallet}
                    disabled={walletLoading}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
                  >
                    {walletLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Generating wallet…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet size={16} />
                        Generate Wallet (Circle)
                      </span>
                    )}
                  </button>
                  {walletError && (
                    <p className="text-xs text-red-400 mt-3">{walletError}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* CARD 2 — Deposit / Fund Wallet                                   */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ArrowDownToLine size={16} className="text-blue-400" />
                <h2 className="text-sm font-semibold">Deposit / Fund Wallet</h2>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Transak */}
              <button
                onClick={handleTransakDeposit}
                disabled={!wallet}
                className="flex flex-col items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5 hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 text-xs font-bold">T</span>
                  </div>
                  <span className="text-sm font-semibold text-blue-300">
                    Transak
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  BRL via PIX → SOL / USDC
                </p>
                <p className="text-[10px] text-gray-600">
                  Instant fiat onramp with PIX payment
                </p>
              </button>

              {/* Stripe */}
              <button
                onClick={handleStripeDeposit}
                disabled={!wallet}
                className="flex flex-col items-start gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-5 hover:bg-purple-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm font-semibold text-purple-300">
                    Stripe Crypto
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Card / Bank → USDC on Solana
                </p>
                <p className="text-[10px] text-gray-600">
                  Stripe Crypto Onramp integration
                </p>
              </button>
            </div>
          </section>

          {/* ================================================================ */}
          {/* CARD 3 — Solana Pay & Transfers                                  */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-cyan-400" />
                <h2 className="text-sm font-semibold">Solana Pay & Transfers</h2>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Receive — QR Code */}
              <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Receive
                </h3>

                {wallet ? (
                  <>
                    <div className="bg-white rounded-xl p-3 shadow-lg shadow-black/20">
                      <QRCodeSVG
                        value={`solana:${wallet.address}?network=devnet&label=Rendey%20Payment`}
                        size={160}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="M"
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono text-center break-all max-w-[200px]">
                      {wallet.address}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Scan to receive SOL/USDC on Devnet
                    </p>
                  </>
                ) : (
                  <div className="w-40 h-40 bg-white/[0.03] rounded-xl border border-dashed border-white/10 flex items-center justify-center">
                    <span className="text-gray-600 text-xs">Generate wallet first</span>
                  </div>
                )}
              </div>

              {/* Send — Transfer */}
              <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
                  Send
                </h3>

                {/* Amount input */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">
                    Amount (SOL)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    min="0.001"
                    step="0.1"
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors font-mono"
                    placeholder="0.01"
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSendPayment}
                  disabled={!wallet || paySending}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  {paySending ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send SOL
                    </>
                  )}
                </button>

                {/* Transaction result */}
                {payTxHash && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-emerald-400 mb-1">
                      ✓ Transaction simulated
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono break-all">
                      {payTxHash}
                    </p>
                  </div>
                )}

                {/* Network info */}
                {wallet && (
                  <div className="mt-auto bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 text-[10px] text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Network</span>
                      <span className="text-cyan-400">Solana Devnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RPC</span>
                      <span className="font-mono text-[9px]">api.devnet.solana.com</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* ---- Footer ---- */}
        <footer className="border-t border-white/[0.06] py-6 mt-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-gray-600">
              © 2026 Rendey — Crypto-Fiat Payment Platform
            </p>
            <p className="text-[10px] text-gray-700">
              Circle · Stripe · Solana · Built for Brazil
            </p>
          </div>
        </footer>
      </div>

      {/* ---- Transak Mock Modal ---- */}
      <TransakMockModal
        isOpen={transakOpen}
        onClose={() => setTransakOpen(false)}
        onSuccess={handleTransakSuccess}
        walletAddress={wallet?.address || ""}
      />
    </>
  );
}
