"use client";

/* eslint-disable @typescript-eslint/no-explicit-any --
   Type boundary: @solana/pay's encodeURL typings may expect @solana/kit
   Address types while we hold @solana/web3.js v1 PublicKey instances. The
   runtime objects are fully compatible — casts are type-level only. */

/**
 * Valence — SolanaPayCheckout
 *
 * Official Solana Pay protocol integration (@solana/pay):
 *   • encodeURL() builds the spec-compliant transfer-request QR — USDC SPL
 *     mint for the configured cluster, unique `reference` keypair (passed as
 *     an array per the transfer-request spec), label "Valence Terminal", and
 *     an order-id `message`.
 *   • useSolanaPayMonitor polls findReference() → validateTransfer() and
 *     flips the UI to "Payment Confirmed" the moment the transfer settles
 *     on-chain, emitting `onConfirmed` for the parent ledger.
 *
 * Toast lifecycle (sonner): Initiated → Confirmed / Failed / Expired.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { encodeURL } from "@solana/pay";
import BigNumber from "bignumber.js";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
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
  getSolanaCluster,
  getUsdcMint,
  isValidSolanaAddress,
} from "@/lib/solana";
import { useSolanaPayMonitor } from "@/hooks/useSolanaPayMonitor";

type Phase = "idle" | "paying" | "confirmed" | "expired" | "error";

const PAYMENT_WINDOW_MS = 180_000;
const PAYMENT_WINDOW_S = PAYMENT_WINDOW_MS / 1000;

const PHASE_STYLES: Record<
  Phase,
  { label: string; dot: string; text: string }
> = {
  idle: {
    label: "Ready",
    dot: "bg-gray-500",
    text: "text-gray-400",
  },
  paying: {
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
  const [phase, setPhase] = useState<Phase>("idle");
  const [reference, setReference] = useState<PublicKey | null>(null);
  const [payUrl, setPayUrl] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(PAYMENT_WINDOW_S);
  // Amount is locked at checkout start so later edits to the amount input
  // never corrupt the QR or the on-chain validation for an in-flight payment.
  const [lockedAmount, setLockedAmount] = useState<number | null>(null);

  const recipientKey = useMemo(
    () => (isValidSolanaAddress(recipient) ? new PublicKey(recipient) : null),
    [recipient]
  );

  const clusterLabel = useMemo(
    () => (getSolanaCluster() === "mainnet-beta" ? "Mainnet" : "Devnet"),
    []
  );

  const monitoring = phase === "paying";
  const {
    status,
    signature,
    error: monitorError,
  } = useSolanaPayMonitor({
    reference: monitoring ? reference : null,
    recipient: monitoring ? recipientKey : null,
    amountUsdc: monitoring ? lockedAmount : null,
    timeoutMs: PAYMENT_WINDOW_MS,
  });

  // React to on-chain settlement events.
  useEffect(() => {
    if (phase !== "paying") return;

    if (status === "confirmed" && signature) {
      const settled = lockedAmount ?? amountUsdc;
      setPhase("confirmed");
      toast.success(
        `Payment confirmed — ${settled.toFixed(2)} USDC received.`
      );
      onConfirmed?.({ signature, amountUsdc: settled });
    } else if (status === "failed") {
      const message =
        monitorError ?? "On-chain transfer validation failed.";
      setPhase("error");
      setError(message);
      toast.error("Payment failed validation.", { description: message });
    } else if (status === "timeout") {
      setPhase("expired");
      toast.info("Payment window expired — no settlement detected.");
    }
  }, [phase, status, signature, monitorError, lockedAmount, amountUsdc, onConfirmed]);

  // Countdown while awaiting settlement.
  useEffect(() => {
    if (phase !== "paying") return;
    setCountdown(PAYMENT_WINDOW_S);
    const timer = setInterval(
      () => setCountdown((prev) => (prev <= 1 ? 0 : prev - 1)),
      1_000
    );
    return () => clearInterval(timer);
  }, [phase]);

  const start = useCallback(() => {
    setError("");

    if (!recipientKey) {
      setPhase("error");
      setError("Invalid merchant wallet address.");
      toast.error("Invalid merchant wallet address.");
      return;
    }
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
      setPhase("error");
      setError("Enter an amount greater than zero.");
      toast.error("Enter an amount greater than zero.");
      return;
    }

    const newReference = Keypair.generate().publicKey;
    const newOrderId = crypto.randomUUID().slice(0, 8).toUpperCase();

    try {
      // Type boundary: encodeURL's typings may expect @solana/kit Address
      // types while we hold @solana/web3.js v1 PublicKey/BigNumber instances.
      // Runtime objects are compatible — casts are type-level only. The
      // `reference` param is passed as an array per the transfer-request spec.
      const url = encodeURL({
        recipient: recipientKey as any,
        amount: new BigNumber(amountUsdc) as any,
        splToken: getUsdcMint() as any,
        reference: [newReference] as any,
        label: "Valence Terminal",
        message: `Valence order ${newOrderId}`,
      });

      setReference(newReference);
      setOrderId(newOrderId);
      setPayUrl(url.toString());
      setLockedAmount(amountUsdc);
      setPhase("paying");
      toast.info("Solana Pay checkout initiated.", {
        description: `Order ${newOrderId} · waiting for on-chain payment…`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to build Solana Pay link.";
      setPhase("error");
      setError(message);
      toast.error(message);
    }
  }, [recipientKey, amountUsdc]);

  const reset = useCallback(() => {
    setPhase("idle");
    setReference(null);
    setPayUrl("");
    setOrderId("");
    setError("");
    setLockedAmount(null);
    setCountdown(PAYMENT_WINDOW_S);
  }, []);

  const copyUrl = useCallback(() => {
    if (!payUrl) return;
    navigator.clipboard.writeText(payUrl).then(
      () => toast.success("Solana Pay link copied."),
      () => toast.error("Could not copy the link.")
    );
  }, [payUrl]);

  const phaseStyle = PHASE_STYLES[phase];
  const displayAmount = lockedAmount ?? amountUsdc;
  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
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
              USDC · Solana {clusterLabel} · Zero custody
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

        {/* PAYING (QR displayed, awaiting on-chain settlement) */}
        {phase === "paying" && (
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
                  {displayAmount.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-emerald-300">
                  USDC
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-mono break-all">
                To: {recipient}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5 font-mono">
                Order {orderId}
                {reference
                  ? ` · ref ${reference.toBase58().slice(0, 12)}…`
                  : ""}
              </p>

              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-3.5 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-amber-300 animate-spin shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-200">
                    Waiting for on-chain settlement…
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Watching the reference key via findReference + validating
                    the USDC transfer.
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
                {displayAmount.toFixed(2)} USDC settled to your wallet.
              </p>
              {orderId && (
                <p className="text-[10px] text-gray-600 mt-0.5 font-mono">
                  Order {orderId}
                </p>
              )}
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
