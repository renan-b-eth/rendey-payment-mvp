// =============================================================================
// GET /api/wallet/transactions — Valence Payment Platform
//
// Real on-chain transaction ledger for the authenticated merchant's wallet.
// Fetches recent signatures from Solana RPC (getSignaturesForAddress) and
// parses each transaction's pre/post token balances to extract the USDC
// delta for THIS wallet (amount + direction). No mock rows, no placeholders.
//
// The wallet is bound to the session (never to a client-supplied address),
// so merchants can only read their own ledger.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAuthContext } from "@/lib/session";
import {
  getSolanaConnection,
  getUsdcMint,
  isValidSolanaAddress,
} from "@/lib/solana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNATURE_LIMIT = 10;

interface TransactionRow {
  signature: string;
  /** Unix seconds (on-chain blockTime); null when unavailable. */
  timestamp: number | null;
  /** Parsed USDC delta for this wallet; null for non-USDC transactions. */
  amountUsdc: number | null;
  direction: "in" | "out" | "unknown";
}

/** Structural subset of web3.js ParsedTokenBalance. */
interface TokenBalanceLike {
  owner?: string;
  mint: string;
  uiTokenAmount: { uiAmountString: string };
}

export async function GET(request: NextRequest) {
  const ctx = getAuthContext(request);
  if (!ctx) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const address = ctx.merchant.walletAddress;
  if (!address || !isValidSolanaAddress(address)) {
    // Wallet not provisioned yet — empty ledger, not an error.
    return NextResponse.json({ transactions: [] }, { status: 200 });
  }

  try {
    const connection = getSolanaConnection();
    const owner = new PublicKey(address);
    const usdcMint = getUsdcMint().toBase58();

    const signatures = await connection.getSignaturesForAddress(owner, {
      limit: SIGNATURE_LIMIT,
    });

    const transactions: TransactionRow[] = await Promise.all(
      signatures.map(async (info) => {
        let amountUsdc: number | null = null;
        let direction: TransactionRow["direction"] = "unknown";

        try {
          const tx = await connection.getParsedTransaction(info.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          });

          if (tx?.meta) {
            const sumUsdc = (
              balances: readonly TokenBalanceLike[] | undefined
            ): number =>
              (balances ?? [])
                .filter((b) => b.owner === address && b.mint === usdcMint)
                .reduce(
                  (acc, b) =>
                    acc + Number(b.uiTokenAmount.uiAmountString ?? "0"),
                  0
                );

            const delta =
              sumUsdc(tx.meta.postTokenBalances) -
              sumUsdc(tx.meta.preTokenBalances);

            if (Math.abs(delta) > 0) {
              amountUsdc = Math.round(Math.abs(delta) * 1e6) / 1e6;
              direction = delta > 0 ? "in" : "out";
            }
          }
        } catch {
          // Unparseable or pruned transaction — still list the signature,
          // just without a parsed amount.
        }

        return {
          signature: info.signature,
          timestamp: info.blockTime ?? null,
          amountUsdc,
          direction,
        };
      })
    );

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("[Valence][Wallet] Failed to fetch transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch on-chain transactions." },
      { status: 502 }
    );
  }
}
