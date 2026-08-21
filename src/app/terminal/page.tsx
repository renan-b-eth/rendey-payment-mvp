"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { QRCodeSVG } from "qrcode.react";
import {
  Zap,
  ArrowLeft,
  RefreshCw,
  Wallet,
  Copy,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Shield,
  ShieldCheck,
  Activity,
  Nfc,
  QrCode,
  Send,
  Clock,
  FileCheck,
  DollarSign,
  ArrowDownToLine,
  ArrowRightLeft,
  Building2,
  TrendingUp,
} from "lucide-react";
import TransakMockModal from "@/components/TransakMockModal";

// =============================================================================
// Unified POS Terminal & Dashboard — Valence by Rendey
//
// Combines:
//   1. NFC Tap-to-Pay POS Terminal (state machine: idle → listening → processing → success)
//   2. Wallet Management (Circle API, balance, copy, explorer)
//   3. Compliance & KYC Status Card
//   4. Multi-Currency Fiat→Crypto Calculator
//   5. Deposit / Fund Wallet (Transak PIX + Stripe Crypto Onramp)
//   6. Solana Pay & Transfers (QR receive + Send SOL)
//   7. Transaction Ledger / Audit Trail
// =============================================================================

const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";

const BRL_TO_USDC_RATE = 5.72;

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

// ---- Exchange rates (simulated for staging) --------------------------------
const EXCHANGE_RATES: Record<
  string,
  { rate: number; symbol: string; networkFee: number; settlement: string }
> = {
  BRL: { rate: 5.72, symbol: "R$", networkFee: 0.01, settlement: "< 10s" },
  USD: { rate: 1.0, symbol: "$", networkFee: 0.005, settlement: "< 5s" },
  EUR: { rate: 0.92, symbol: "€", networkFee: 0.008, settlement: "< 8s" },
};

const FIAT_OPTIONS = [
  { code: "BRL", label: "BRL (PIX)", flag: "🇧🇷" },
  { code: "USD", label: "USD (Stripe)", flag: "🇺🇸" },
  { code: "EUR", label: "EUR (SEPA)", flag: "🇪🇺" },
];

// ---- Types -----------------------------------------------------------------
interface WalletInfo {
  id: string;
  address: string;
  chain: string;
  currency: string;
  state: string;
}

interface LedgerEntry {
  id: string;
  timestamp: string;
  type: string;
  fiatAmount: string;
  usdcAmount: string;
  status: "Completed" | "Pending" | "Failed";
  txHash?: string;
  method?: "NFC" | "PIX" | "QR";
}

type TerminalState = "idle" | "listening" | "processing" | "success" | "error";

// ---- Mock wallet generator (valid base58) ----------------------------------
function generateMockWallet(seed: string): WalletInfo {
  const BASE58 =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const buf = Buffer.from(seed + Date.now(), "utf-8");
  let address = "";
  for (let i = 0; i < 44; i++) {
    address += BASE58[buf[i % buf.length] % BASE58.length];
  }
  return {
    id: `wallet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    address,
    chain: "SOLANA",
    currency: "USDC",
    state: "LIVE",
  };
}

// =============================================================================
// Unified Terminal Page
// =============================================================================
export default function TerminalPage() {
  // ---- Wallet state --------------------------------------------------------
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  // ---- NFC Terminal state --------------------------------------------------
  const [chargeAmount, setChargeAmount] = useState<string>("0.00");
  const [terminalState, setTerminalState] = useState<TerminalState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"NFC" | "PIX" | "QR">(
    "NFC"
  );
  const pulseRef = useRef<HTMLDivElement>(null);

  // ---- Transak modal state -------------------------------------------------
  const [transakOpen, setTransakOpen] = useState(false);

  // ---- Calculator state ----------------------------------------------------
  const [calcFiat, setCalcFiat] = useState("BRL");
  const [calcAmount, setCalcAmount] = useState<string>("100");

  // ---- Solana Pay state ----------------------------------------------------
  const [payAmount, setPayAmount] = useState<string>("0.01");
  const [payTxHash, setPayTxHash] = useState<string | null>(null);
  const [paySending, setPaySending] = useState(false);

  // ---- Ledger state --------------------------------------------------------
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  // ---- Clock ---------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ---- Computed values for calculator --------------------------------------
  const calcParsed = parseFloat(calcAmount) || 0;
  const calcRate = EXCHANGE_RATES[calcFiat];
  const calcUsdc = calcParsed / calcRate.rate;
  const calcNetUsdc = calcUsdc - calcRate.networkFee;

  // ---- Computed NFC values -------------------------------------------------
  const parsedAmount = parseFloat(chargeAmount) || 0;
  const usdcOutput = parsedAmount / BRL_TO_USDC_RATE;
  const totalUsdc = ledger.reduce((sum, tx) => {
    const val = parseFloat(tx.usdcAmount);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // ---- Ledger helper -------------------------------------------------------
  const addLedgerEntry = useCallback(
    (entry: Omit<LedgerEntry, "id" | "timestamp">) => {
      setLedger((prev) => [
        {
          ...entry,
          id: `TX-${Date.now().toString(36).toUpperCase()}-${Math.random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    []
  );

  // ---- Fetch SOL balance ---------------------------------------------------
  const fetchBalance = useCallback(
    async (address?: string) => {
      const addr = address || wallet?.address;
      if (!addr || !BASE58_REGEX.test(addr)) return;
      setBalanceLoading(true);
      try {
        const connection = new Connection(SOLANA_RPC_URL, "confirmed");
        const pubkey = new PublicKey(addr);
        const lamports = await connection.getBalance(pubkey);
        setSolBalance(lamports / LAMPORTS_PER_SOL);
      } catch {
        if (solBalance === null) setSolBalance(0);
      } finally {
        setBalanceLoading(false);
      }
    },
    [wallet?.address, solBalance]
  );

  // ---- Generate wallet -----------------------------------------------------
  const handleGenerateWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/wallet/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "merchant@valence.rendey.store" }),
      });
      const data = await res.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
        addLedgerEntry({
          type: "Wallet Generated",
          fiatAmount: "—",
          usdcAmount: "—",
          status: "Completed",
          txHash: data.wallet.id,
        });
        setTimeout(() => fetchBalance(data.wallet.address), 500);
      } else {
        const mock = generateMockWallet("merchant@valence.rendey.store");
        setWallet(mock);
        addLedgerEntry({
          type: "Wallet Generated",
          fiatAmount: "—",
          usdcAmount: "—",
          status: "Completed",
          txHash: mock.id,
        });
      }
    } catch {
      const mock = generateMockWallet("merchant@valence.rendey.store");
      setWallet(mock);
    } finally {
      setWalletLoading(false);
    }
  }, [addLedgerEntry, fetchBalance]);

  // ---- Fetch balance on wallet change --------------------------------------
  useEffect(() => {
    if (wallet?.address) {
      fetchBalance(wallet.address);
    }
  }, [wallet?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Copy wallet address -------------------------------------------------
  const handleCopyAddress = useCallback(() => {
    if (!wallet?.address) return;
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [wallet?.address]);

  // ---- Transak deposit -----------------------------------------------------
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
      addLedgerEntry({
        type: "PIX Deposit",
        fiatAmount: `R$ ${(usdcAmount * EXCHANGE_RATES.BRL.rate).toFixed(2)}`,
        usdcAmount: `${usdcAmount.toFixed(2)} USDC`,
        status: "Completed",
        method: "PIX",
      });
      fetchBalance();
    },
    [fetchBalance, addLedgerEntry]
  );

  // ---- Stripe deposit ------------------------------------------------------
  const handleStripeDeposit = useCallback(async () => {
    if (!wallet?.address) {
      alert("Generate a wallet first.");
      return;
    }
    try {
      const res = await fetch("/api/stripe/onramp-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: wallet.address,
          amountUsd: 50,
        }),
      });
      const data = await res.json();
      if (data.mock) {
        setUsdcBalance((prev) => prev + 50);
        addLedgerEntry({
          type: "Stripe Deposit",
          fiatAmount: "$50.00",
          usdcAmount: "50.00 USDC",
          status: "Completed",
        });
        alert(
          `${data.message}\n\nSimulated $50 USDC deposit completed.`
        );
      } else if (data.clientSecret) {
        addLedgerEntry({
          type: "Stripe Deposit",
          fiatAmount: "$50.00",
          usdcAmount: "50.00 USDC",
          status: "Pending",
        });
        alert(
          `Stripe Crypto Onramp session created!\nSession: ${data.sessionId}\n\nIn production, this opens the Stripe Crypto Onramp UI.`
        );
      }
    } catch {
      alert("Stripe integration error. Check console.");
    }
  }, [wallet?.address, addLedgerEntry]);

  // ---- Solana Pay — simulate sending ---------------------------------------
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockHash = `Tx${Date.now().toString(36)}${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      setPayTxHash(mockHash);
      setSolBalance((prev) => Math.max(0, (prev ?? 0) - amount * 0.00001));
      addLedgerEntry({
        type: "SOL Transfer",
        fiatAmount: `~$${(amount * 140).toFixed(2)}`,
        usdcAmount: `${amount.toFixed(4)} SOL`,
        status: "Completed",
        txHash: mockHash,
      });
    } catch {
      alert("Transaction failed.");
    } finally {
      setPaySending(false);
    }
  }, [wallet?.address, payAmount, addLedgerEntry]);

  // ---- NFC Tap simulation --------------------------------------------------
  const handleTap = useCallback(async () => {
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Enter a valid charge amount in BRL.");
      return;
    }

    setTerminalState("listening");
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

    setTerminalState("processing");
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    const usdcAmt = amount / BRL_TO_USDC_RATE;
    const mockHash = `Sol${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    setTerminalState("success");
    setTxHash(mockHash);

    addLedgerEntry({
      type: "NFC Payment",
      fiatAmount: `R$ ${amount.toFixed(2)}`,
      usdcAmount: `${usdcAmt.toFixed(2)} USDC`,
      status: "Completed",
      txHash: mockHash,
      method: selectedMethod,
    });

    fetchBalance();
  }, [chargeAmount, selectedMethod, addLedgerEntry, fetchBalance]);

  // ---- Reset terminal ------------------------------------------------------
  const handleReset = useCallback(() => {
    setTerminalState("idle");
    setTxHash(null);
    setChargeAmount("0.00");
  }, []);

  // ==========================================================================
  // Render
  // ==========================================================================
  return (
    <>
      <div className="min-h-screen bg-[#0a0b0d] text-white font-sans">
        {/* ---- Top Bar ---- */}
        <header className="border-b border-white/[0.06] bg-[#0a0b0d]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-xs">Home</span>
            </a>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
              <span className="text-sm font-bold">
                <span className="text-emerald-400">Valence</span>
                <span className="text-gray-600 text-xs font-normal ml-1.5">
                  POS Terminal
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-1 font-medium border border-emerald-500/20">
                SOLANA DEVNET
              </span>
              <span className="text-[10px] text-gray-600 font-mono">
                {currentTime.toLocaleTimeString("en-US", { hour12: false })}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* ================================================================ */}
          {/* 1. COMPLIANCE & KYC STATUS CARD                                  */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.03] to-cyan-500/[0.06] backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-emerald-500/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-emerald-300">
                  Compliance & Verification
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">
                  LIVE
                </span>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Merchant Status
                  </p>
                  <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                    Verified (Sandbox)
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    KYB cleared · CNPJ validated
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Activity size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Transak Gateway
                  </p>
                  <p className="text-sm font-semibold text-blue-300 mt-0.5">
                    Connected & Active
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    PIX enabled · Sandbox mode
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Daily Limit
                  </p>
                  <p className="text-sm font-semibold text-purple-300 mt-0.5">
                    R$ 50,000.00
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    0% used today
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* 2. WALLET STATUS                                                 */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
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
                        <CheckCircle2
                          size={14}
                          className="text-emerald-400"
                        />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
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
                        ${usdcBalance.toFixed(2)}
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
                        <RefreshCw
                          size={14}
                          className="animate-spin"
                        />{" "}
                        Setting up…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wallet size={16} /> Initialize POS Terminal
                      </span>
                    )}
                  </button>
                  {walletError && (
                    <p className="text-xs text-red-400 mt-3">
                      {walletError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* 3. NFC TAP-TO-PAY TERMINAL                                        */}
          {/* ================================================================ */}
          {wallet && (
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Nfc size={16} className="text-cyan-400" />
                  <h2 className="text-sm font-semibold">
                    NFC Tap-to-Pay Terminal
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <Activity size={12} className="text-emerald-400" />
                  <span className="text-[10px] text-emerald-400 font-medium">
                    ACTIVE
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col items-center">
                {/* ---- Amount Input (idle) ---- */}
                {terminalState === "idle" && (
                  <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                        Charge Amount
                      </p>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold">
                          R$
                        </span>
                        <input
                          type="number"
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl pl-12 pr-4 py-5 text-3xl font-bold text-white text-center focus:outline-none focus:border-emerald-500/50 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                      {parsedAmount > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          ≈{" "}
                          <span className="text-emerald-400 font-semibold">
                            ${usdcOutput.toFixed(2)} USDC
                          </span>{" "}
                          on Solana
                        </p>
                      )}
                    </div>

                    {/* Payment method selector */}
                    <div className="flex gap-2 justify-center">
                      {(["NFC", "PIX", "QR"] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMethod(m)}
                          className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                            selectedMethod === m
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:bg-white/[0.05]"
                          }`}
                        >
                          {m === "NFC" && <Nfc size={12} />}
                          {m === "PIX" && <QrCode size={12} />}
                          {m === "QR" && <QrCode size={12} />}
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* Ready to Tap Button */}
                    <button
                      onClick={handleTap}
                      disabled={parsedAmount <= 0}
                      className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 hover:from-emerald-500 hover:via-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-6 text-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <Nfc size={24} />
                        Ready to Tap
                      </span>
                      <span className="block text-xs font-normal text-white/60 mt-1">
                        Tap phone or card to complete payment
                      </span>
                    </button>
                  </div>
                )}

                {/* ---- Listening State ---- */}
                {terminalState === "listening" && (
                  <div className="w-full max-w-sm flex flex-col items-center py-8 space-y-6">
                    <div className="relative">
                      <div
                        ref={pulseRef}
                        className="w-32 h-32 rounded-full border-2 border-cyan-400/50 flex items-center justify-center animate-pulse"
                      >
                        <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30 flex items-center justify-center">
                          <Nfc
                            size={40}
                            className="text-cyan-400 animate-ping"
                          />
                        </div>
                      </div>
                      <div
                        className="absolute inset-0 w-32 h-32 rounded-full border border-cyan-400/20 animate-ping"
                        style={{ animationDuration: "2s" }}
                      />
                      <div
                        className="absolute -inset-4 w-40 h-40 rounded-full border border-cyan-400/10 animate-ping"
                        style={{ animationDuration: "3s" }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">
                        Listening for{" "}
                        {selectedMethod === "NFC"
                          ? "NFC device"
                          : selectedMethod === "PIX"
                            ? "PIX payment"
                            : "QR scan"}
                        ...
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Hold your phone or card near the terminal
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock size={12} className="animate-spin" />
                      Awaiting payment detection
                    </div>
                  </div>
                )}

                {/* ---- Processing State ---- */}
                {terminalState === "processing" && (
                  <div className="w-full max-w-sm flex flex-col items-center py-8 space-y-6">
                    <div className="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
                      <RefreshCw
                        size={36}
                        className="text-amber-400 animate-spin"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">
                        Processing Payment...
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedMethod === "NFC"
                          ? "Card read"
                          : selectedMethod === "PIX"
                            ? "PIX detected"
                            : "QR scanned"}{" "}
                        · Converting BRL → USDC
                      </p>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 size={12} /> Payment authorized
                      </div>
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <RefreshCw size={12} className="animate-spin" />{" "}
                        Settling on Solana...
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="w-3" /> Awaiting confirmation
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- Success State ---- */}
                {terminalState === "success" && (
                  <div className="w-full max-w-sm flex flex-col items-center py-8 space-y-5">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
                      <CheckCircle2
                        size={48}
                        className="text-emerald-400"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">
                        Payment Settled!
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Instant settlement on Solana Devnet
                      </p>
                    </div>
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Amount (BRL)</span>
                        <span className="text-white font-semibold">
                          R$ {parsedAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Settled (USDC)</span>
                        <span className="text-emerald-400 font-semibold">
                          ${usdcOutput.toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="border-t border-emerald-500/10 pt-2 flex justify-between text-xs">
                        <span className="text-gray-500">TX Hash</span>
                        <span className="text-gray-400 font-mono truncate max-w-[180px]">
                          {txHash}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Network</span>
                        <span className="text-cyan-400">
                          Solana Devnet ✓
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white font-semibold py-3 rounded-xl transition-all text-sm"
                    >
                      New Transaction
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* 4. MULTI-CURRENCY FIAT→CRYPTO CALCULATOR                         */}
          {/* ================================================================ */}
          {wallet && (
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-amber-400" />
                  <h2 className="text-sm font-semibold">
                    Fiat → Crypto Calculator
                  </h2>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">
                      You pay
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={calcFiat}
                        onChange={(e) => setCalcFiat(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        {FIAT_OPTIONS.map((o) => (
                          <option
                            key={o.code}
                            value={o.code}
                            className="bg-gray-900"
                          >
                            {o.flag} {o.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        min="1"
                        className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50 transition-colors"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center pb-1">
                    <div className="w-10 h-10 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                      <ArrowRightLeft size={14} className="text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">
                      You receive (USDC)
                    </label>
                    <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg px-4 py-2.5">
                      <p className="text-lg font-bold text-emerald-300">
                        {calcUsdc > 0 ? `$${calcNetUsdc.toFixed(2)}` : "$0.00"}
                        <span className="text-xs font-normal text-emerald-400/60 ml-1">
                          USDC
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-gray-600">Exchange Rate</p>
                    <p className="text-xs font-semibold text-gray-300 mt-0.5">
                      1 USD = {calcRate.rate} {calcFiat}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-gray-600">
                      Network Fee (Solana)
                    </p>
                    <p className="text-xs font-semibold text-gray-300 mt-0.5">
                      ~${calcRate.networkFee.toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-gray-600">
                      Settlement Time
                    </p>
                    <p className="text-xs font-semibold text-gray-300 mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {calcRate.settlement}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* 5. DEPOSIT / FUND WALLET                                         */}
          {/* ================================================================ */}
          {wallet && (
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <ArrowDownToLine size={16} className="text-blue-400" />
                  <h2 className="text-sm font-semibold">
                    Deposit / Fund Wallet
                  </h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleTransakDeposit}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xs font-bold">
                        T
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-blue-300">
                      Transak
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    BRL via PIX → SOL / USDC
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {"Instant fiat onramp · Settlement < 10s"}
                  </p>
                </button>

                <button
                  onClick={handleStripeDeposit}
                  className="group flex flex-col items-start gap-2 rounded-xl border border-purple-500/20 bg-purple-500/[0.05] p-5 hover:bg-purple-500/10 hover:border-purple-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-400 text-xs font-bold">
                        S
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-purple-300">
                      Stripe Crypto
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Card / Bank → USDC on Solana
                  </p>
                  <p className="text-[10px] text-gray-600">
                    {"Stripe Crypto Onramp · Settlement < 5s"}
                  </p>
                </button>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* 6. SOLANA PAY & TRANSFERS                                        */}
          {/* ================================================================ */}
          {wallet && (
            <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Send size={16} className="text-cyan-400" />
                  <h2 className="text-sm font-semibold">
                    Solana Pay & Transfers
                  </h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Receive — QR Code */}
                <div className="flex flex-col items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Receive
                  </h3>
                  <div className="bg-white rounded-xl p-3 shadow-lg shadow-black/20">
                    <QRCodeSVG
                      value={`solana:${wallet.address}?network=devnet&label=Valence%20Payment`}
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
                </div>

                {/* Send — Transfer */}
                <div className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
                    Send
                  </h3>
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
                  <button
                    onClick={handleSendPayment}
                    disabled={paySending}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                  >
                    {paySending ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />{" "}
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Send SOL
                      </>
                    )}
                  </button>
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
                  <div className="mt-auto bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 text-[10px] text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Network</span>
                      <span className="text-cyan-400">Solana Devnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RPC</span>
                      <span className="font-mono text-[9px]">
                        api.devnet.solana.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/* 7. TRANSACTION LEDGER / AUDIT TRAIL                              */}
          {/* ================================================================ */}
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck size={16} className="text-violet-400" />
                <h2 className="text-sm font-semibold">
                  Transaction Ledger
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Total Volume</p>
                  <p className="text-xs font-bold text-emerald-400">
                    ${totalUsdc.toFixed(2)} USDC
                  </p>
                </div>
                <span className="text-[10px] text-gray-600">
                  {ledger.length} entries
                </span>
              </div>
            </div>

            {ledger.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign
                  size={32}
                  className="text-gray-700 mx-auto mb-3"
                />
                <p className="text-sm text-gray-500">No transactions yet</p>
                <p className="text-xs text-gray-600 mt-1">
                  {wallet
                    ? "Process a payment or make a deposit to see activity here"
                    : "Generate a wallet to get started"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/[0.04]">
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        TX ID
                      </th>
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Type
                      </th>
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Fiat Amount
                      </th>
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Crypto Output
                      </th>
                      <th className="px-6 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
                      >
                        <td className="px-6 py-3 text-[11px] font-mono text-gray-400">
                          {entry.id}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-gray-400">
                          {new Date(entry.timestamp).toLocaleTimeString(
                            "en-US",
                            { hour12: false }
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              entry.type === "PIX Deposit"
                                ? "bg-blue-500/15 text-blue-400"
                                : entry.type === "Stripe Deposit"
                                  ? "bg-purple-500/15 text-purple-400"
                                  : entry.type === "Wallet Generated"
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : entry.type.includes("NFC") ||
                                        entry.type.includes("Payment")
                                      ? "bg-cyan-500/15 text-cyan-400"
                                      : "bg-gray-500/15 text-gray-400"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-[11px] text-gray-300 font-mono">
                          {entry.fiatAmount}
                        </td>
                        <td className="px-6 py-3 text-[11px] text-emerald-400 font-mono">
                          {entry.usdcAmount}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-[10px] font-medium flex items-center gap-1 ${
                              entry.status === "Completed"
                                ? "text-emerald-400"
                                : entry.status === "Pending"
                                  ? "text-amber-400"
                                  : "text-red-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                entry.status === "Completed"
                                  ? "bg-emerald-400"
                                  : entry.status === "Pending"
                                    ? "bg-amber-400"
                                    : "bg-red-400"
                              }`}
                            />
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        {/* ---- Footer ---- */}
        <footer className="border-t border-white/[0.06] py-4 mt-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            <p className="text-[10px] text-gray-700">
              © 2026 Valence by Rendey · NFC POS Terminal
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <Shield size={10} /> Non-Custodial
              </span>
              <span className="text-[10px] text-gray-600 flex items-center gap-1">
                <Shield size={10} /> Encrypted
              </span>
            </div>
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
