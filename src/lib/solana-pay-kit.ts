"use client";

/**
 * Valence — Solana Pay client kit.
 *
 * Strategy:
 *  - Lazy `import("@solana/pay")` for spec-compliant `encodeURL` (v1.0.x is
 *    built on @solana/kit; its `findReference`/`validateTransfer` require kit
 *    RPC clients, so we avoid them).
 *  - Classic `@solana/web3.js` Connection over Helius HTTP RPC for polling
 *    (`getSignaturesForAddress` on the unique reference) and settlement
 *    validation (`getParsedTransaction` token-balance verification).
 */

import {
  Connection,
  Keypair,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";

export const USDC_MAINNET_MINT =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

let cachedConnection: Connection | null = null;

export function getSolanaConnection(): Connection {
  if (!cachedConnection) {
    cachedConnection = new Connection(RPC_URL, "confirmed");
  }
  return cachedConnection;
}

export function isValidSolanaAddress(address: string): boolean {
  return BASE58_REGEX.test(address);
}

/** Fresh unique reference used to locate the payment on-chain. */
export function generatePaymentReference(): PublicKey {
  return Keypair.generate().publicKey;
}

export interface BuildPayUrlInput {
  recipient: string;
  usdcAmount: number;
  reference: PublicKey;
  label?: string;
  message?: string;
}

/**
 * Build a `solana:` transfer-request URL.
 * Prefers `@solana/pay.encodeURL`; falls back to manual encoding so the QR
 * flow never hard-fails in the browser.
 */
export async function buildSolanaPayUrl(input: BuildPayUrlInput): Promise<string> {
  const { recipient, usdcAmount, reference, label, message } = input;

  if (!isValidSolanaAddress(recipient)) {
    throw new Error("Recipient wallet address is not a valid base58 address.");
  }

  try {
    const pay = await import("@solana/pay");
    type Fields = import("@solana/pay").TransferRequestURLFields;
    const url = pay.encodeURL({
      recipient: recipient as Fields["recipient"],
      amount: usdcAmount,
      splToken: USDC_MAINNET_MINT as NonNullable<Fields["splToken"]>,
      reference: reference.toBase58() as NonNullable<Fields["reference"]>,
      label,
      message,
    });
    return url.toString();
  } catch {
    // Manual fallback per the Solana Pay spec.
    const params = new URLSearchParams();
    params.set("amount", usdcAmount.toString());
    params.set("spl-token", USDC_MAINNET_MINT);
    params.set("reference", reference.toBase58());
    if (label) params.set("label", label);
    if (message) params.set("message", message);
    return `solana:${recipient}?${params.toString()}`;
  }
}

export interface ValidatePaymentInput {
  signature: string;
  reference: PublicKey;
  recipient: string;
  usdcAmount: number;
}

/**
 * Validate a settled transaction:
 *  - executes without error,
 *  - mentions the unique reference key,
 *  - credits USDC (mainnet mint) to an account owned by `recipient`,
 *    with the post balance covering at least the requested amount
 *    (plus any pre-existing balance).
 */
export async function validatePaymentTransaction(
  input: ValidatePaymentInput
): Promise<boolean> {
  const connection = getSolanaConnection();
  let tx: ParsedTransactionWithMeta | null = null;

  try {
    tx = await connection.getParsedTransaction(input.signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
  } catch {
    return false;
  }

  if (!tx || tx.meta?.err) return false;

  const reference58 = input.reference.toBase58();
  const accountKeys = tx.transaction.message.accountKeys.map((k) =>
    k.pubkey.toBase58()
  );
  const loaded =
    tx.meta?.loadedAddresses != null
      ? [
          ...tx.meta.loadedAddresses.writable.map((a) => a.toBase58()),
          ...tx.meta.loadedAddresses.readonly.map((a) => a.toBase58()),
        ]
      : [];
  const mentionsReference =
    accountKeys.includes(reference58) || loaded.includes(reference58);
  if (!mentionsReference) return false;

  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];

  const isRecipientUsdc = (b: {
    owner?: string | null;
    mint?: string | null;
  }) => b.owner === input.recipient && b.mint === USDC_MAINNET_MINT;

  for (const postEntry of post) {
    if (!isRecipientUsdc(postEntry)) continue;
    const postAmount = postEntry.uiTokenAmount.uiAmount ?? 0;
    const preEntry = pre.find(
      (p) => p.accountIndex === postEntry.accountIndex
    );
    const preAmount = preEntry?.uiTokenAmount.uiAmount ?? 0;
    // Credited delta must cover the requested payment (small float epsilon).
    if (postAmount - preAmount >= input.usdcAmount - 1e-9) {
      return true;
    }
  }

  return false;
}

export interface WaitForPaymentOptions {
  reference: PublicKey;
  recipient: string;
  usdcAmount: number;
  timeoutMs?: number;
  intervalMs?: number;
  signal?: AbortSignal;
}

export interface PaymentSettlement {
  signature: string;
}

/**
 * Poll Helius for a transaction involving the unique reference key;
 * once found, validate the transfer before reporting settlement.
 */
export async function waitForPayment(
  options: WaitForPaymentOptions
): Promise<PaymentSettlement | null> {
  const {
    reference,
    recipient,
    usdcAmount,
    timeoutMs = 180_000,
    intervalMs = 1_800,
    signal,
  } = options;

  const connection = getSolanaConnection();
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (signal?.aborted) return null;

    try {
      const signatures = await connection.getSignaturesForAddress(reference, {
        limit: 5,
      });

      for (const info of signatures) {
        if (info.err) continue;
        const valid = await validatePaymentTransaction({
          signature: info.signature,
          reference,
          recipient,
          usdcAmount,
        });
        if (valid) {
          return { signature: info.signature };
        }
      }
    } catch {
      // RPC hiccup — keep polling until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}
