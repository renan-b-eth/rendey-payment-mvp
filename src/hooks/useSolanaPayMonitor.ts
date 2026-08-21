"use client";

// =============================================================================
// useSolanaPayMonitor — Valence Payment Platform
//
// Real-time Solana Pay settlement watcher. Polls `findReference()` until the
// transaction carrying our unique reference key appears on-chain, then
// `validateTransfer()` to prove the expected USDC amount reached the expected
// recipient. Consumed by the Solana Pay checkout component.
//
// IMPORTANT: `reference` and `recipient` are PublicKey instances — callers
// must keep them stable (state/useMemo) so the effect doesn't restart every
// render.
// =============================================================================

import { useEffect, useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import {
  findReference,
  validateTransfer,
  FindReferenceError,
  ValidateTransferError,
} from "@solana/pay";
import BigNumber from "bignumber.js";
import { getSolanaConnection, getUsdcMint } from "@/lib/solana";

export type SolanaPayMonitorStatus =
  | "idle"
  | "pending"
  | "confirmed"
  | "failed"
  | "timeout";

export interface UseSolanaPayMonitorParams {
  reference: PublicKey | null;
  recipient: PublicKey | null;
  amountUsdc: number | null;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface UseSolanaPayMonitorResult {
  status: SolanaPayMonitorStatus;
  signature: string | null;
  error: string | null;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_POLL_INTERVAL_MS = 2_500;

export function useSolanaPayMonitor({
  reference,
  recipient,
  amountUsdc,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseSolanaPayMonitorParams): UseSolanaPayMonitorResult {
  const [status, setStatus] = useState<SolanaPayMonitorStatus>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reference || !recipient || !amountUsdc || amountUsdc <= 0) {
      setStatus("idle");
      setSignature(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const connection = getSolanaConnection();
    const usdcMint = getUsdcMint();
    const expectedAmount = new BigNumber(amountUsdc);
    const startedAt = Date.now();

    setStatus("pending");
    setSignature(null);
    setError(null);

    async function poll() {
      if (cancelled) return;

      if (Date.now() - startedAt > timeoutMs) {
        setStatus("timeout");
        setError("Payment not detected within the expected time window.");
        return;
      }

      try {
        const { signature: found } = await findReference(
          connection,
          reference!,
          { finality: "confirmed" }
        );

        // Throws ValidateTransferError if amount/recipient/token mismatch.
        await validateTransfer(
          connection,
          found,
          {
            recipient: recipient!,
            amount: expectedAmount,
            splToken: usdcMint,
            reference: reference!,
          },
          { finality: "confirmed" }
        );

        if (!cancelled) {
          setSignature(found);
          setStatus("confirmed");
        }
        return; // Settlement proven — stop polling.
      } catch (err) {
        if (err instanceof FindReferenceError) {
          // Reference not on-chain yet — keep polling.
        } else if (err instanceof ValidateTransferError) {
          if (!cancelled) {
            setStatus("failed");
            setError(err.message);
          }
          return;
        } else {
          // RPC hiccup — log and keep polling instead of crashing the UI.
          console.warn("[Valence][SolanaPay] poll error:", err);
        }
      }

      if (!cancelled) {
        timer = setTimeout(poll, pollIntervalMs);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, recipient, amountUsdc, timeoutMs, pollIntervalMs]);

  return { status, signature, error };
}
