"use client";

/**
 * Valence — SolanaPayCheckout
 *
 * Encodes a spec-compliant Solana Pay transfer-request QR (USDC mainnet,
 * unique `reference` key), then polls Helius for settlement. On confirmed
 * + validated transfer the UI flips to "Payment Confirmed" with the tx
 * signature and Solscan link. Emits `onConfirmed` so the parent ledger can
 * record the payment.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  RefreshCw,
  Timer,
  XCircle,
} from "lucide-react";
import {
  BASE58_REGEX,
  buildSolanaPayUrl,
  generatePaymentReference,
  isValidSolanaAddress,
  waitForPayment,
} from "@/lib/solana-pay-kit";
import { useToast } from "@/lib/toast";

type Phase = "idle" | "qr" | "pending" | "confirmed" | "expired" | "error";

const PHASE_STYLES: Record<
  Phase,
  { label: string; dot: string; text: string }
> = {
  idle: {
    label: "Ready",
    dot: "bg-gray-500",
    text: "text-gray-400",
  },
  qr: {
    label: "Scan to Pay",
    dot: "bg-cyan-400",
    text: "text-cyan-300",
  },
  pending: {
    label: "Awaiting Settlement",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-300",
  },
  confirmed: {
    label: "Payment Confirmed",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  expired: {
    label: "Expired",
    dot: "bg-gray-500",
    text: "text-gray-400",
  },
  error: {
    label: "Error",
    dot: "bg-red-400",
    text: "text-red-300",
  },
};

export interface SolanaPayCheckoutProps {
  recipient: string;
  amountUsdc: number;
  onConfirmed?: (data: { signature: string; amountUsdc: number }) => void;
}

export default function SolanaPayCheckout({
  recipient,
  amountUsdc,
  onConfirmed,
}: SolanaPayCheckoutProps) {
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("idle");
  const [payUrl, setPayUrl] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(180);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const referenceRef = useRef<import("@solana/web3.js").PublicKey | null>(null);

  const stopTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stopTimers();
    setPhase("idle");
    setPayUrl("");
    setSignature("");
    setError("");
    setCountdown(180);
    referenceRef.current = null;
  }, [stopTimers]);

  useEffect(() => () => stopTimers(), [stopTimers]);

  const start = useCallback(async () => {
    setError("");
    setSignature("");

    if (!isValidSolanaAddress(recipient) || !BASE58_REGEX.test(recipient)) {
      setPhase("error");
      setError("Invalid merchant wallet address.");
      toast("Invalid merchant wallet address.", "error");
      return;
    }
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      setPhase("error");
      setError("Enter an amount greater than zero.");
      toast("Enter an amount greater than zero.", "error");
      return;
    }

    const reference = generatePaymentReference();
    referenceRef.current = reference;

    try {
      const url = await buildSolanaPayUrl({
        recipient,
        usdcAmount: amountUsdc,
        reference,
        label: "Valence POS",
        message: `Valence payment of ${amountUsdc} USDC`,
      });
      setPayUrl(url);
      setPhase("qr");
      setCountdown(180);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to build Solana Pay link.";
      setPhase("error");
      setError(message);
      toast(message, "error");
      return;
    }

    // Begin polling for settlement.
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("pending");

    const settle = await waitForPayment({
      reference,
      recipient,
      usdcAmount: amountUsdc,
      timeoutMs: 180_000,
      intervalMs: 1_800,
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    if (settle) {
      setSignature(settle.signature);
      setPhase("confirmed");
      toast(`Payment confirmed — ${amountUsdc} USDC received.`, "success");
      onConfirmed?.({ signature: settle.signature, amountUsdc });
    } else {
      setPhase("expired");
      toast("Payment window expired — no settlement detected.", "info");
    }
  }, [recipient, amountUsdc, onConfirmed, toast]);

  // Countdown while awaiting settlement.
  useEffect(() => {
    if (phase !== "pending" && phase !== "qr") return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase]);

  const copyUrl = useCallback(() => {
    if (!payUrl) return;
    navigator.clipboard.writeText(payUrl).then(() => {
      toast("Solana Pay link copied.", "success", 2200);
    });
  }, [payUrl, toast]);

  const phaseStyle = PHASE_STYLES[phase];
  const mm = String(Math.floor(countdown / 60)).padStart(1, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Solana Pay Checkout
            </h3>
            <p className="text-[10px] text-gray-500">
              USDC · Solana Mainnet · Zero custody
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${phaseStyle.dot}`}
            aria-hidden="true"
          />
          <span className={`text-[11px] font-medium ${phaseStyle.text}`}>
            {phaseStyle.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        {/* IDLE */}
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/[0.07] border border-cyan-500/20 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-cyan-300/60" />
            </div>
            <p className="text-xs text-gray-400 max-w-[26rem]">
              Generate a Solana Pay QR for{" "}
              <span className="text-white font-semibold">
                {amountUsdc.toFixed(2)} USDC
              </span>
              . Your customer scans with any Solana wallet; settlement is
              detected on-chain in seconds.
            </p>
            <button
              onClick={start}
              className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-[#06210f] text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              Generate Payment QR
            </button>
          </div>
        )}

        {/* QR + PENDING */}
        {(phase === "qr" || phase === "pending") && (
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex flex-col items-center gap-3 mx-auto sm:mx-0">
              <div className="bg-white rounded-xl p-3 shadow-lg shadow-black/30">
                <QRCodeSVG
                  value={payUrl}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#0a0b0d"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <button
                onClick={copyUrl}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy payment link
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {amountUsdc.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-emerald-300">
                  USDC
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-mono break-all">
                To: {recipient}
              </p>

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-amber-300 animate-spin shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-200">
                    Waiting for on-chain settlement…
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Watching reference key on Solana mainnet via Helius.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs shrink-0">
                  <Timer className="w-3.5 h-3.5" />
                  {mm}:{ss}
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-2">
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIRMED */}
        {phase === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-300" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-emerald-300">
                Payment Confirmed
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                {amountUsdc.toFixed(2)} USDC settled to your wallet.
              </p>
            </div>
            {signature && (
              <a
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 break-all max-w-full transition-colors"
              >
                {signature.slice(0, 20)}…{signature.slice(-8)}
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            )}
            <button
              onClick={reset}
              className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#06210f] text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New Payment
            </button>
          </div>
        )}

        {/* EXPIRED */}
        {phase === "expired" && (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-500/15 border-2 border-gray-500/30 flex items-center justify-center">
              <Timer className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-300">
                Payment Window Expired
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                No settlement detected within 3 minutes. Generate a fresh QR if
                the customer still wants to pay.
              </p>
            </div>
            <button
              onClick={reset}
              className="mt-1 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-300" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-red-300">
                Could Not Start Checkout
              </h4>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
            <button
              onClick={reset}
              className="mt-1 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-xs text-gray-300 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
