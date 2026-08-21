import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/session";
import * as db from "@/lib/db";
import { provisionMerchantWallet } from "@/lib/circle-wallet";

/**
 * POST /api/circle/create-wallet
 *
 * Auth-gated. Provisions a Developer-Controlled Wallet on Solana Mainnet
 * via Circle Web3 Services and persists the address to the merchant
 * profile. Idempotent: if the merchant already has a wallet, the existing
 * one is returned instead of provisioning a duplicate.
 *
 * Uses REST → deterministic-mock fallback inside `provisionMerchantWallet`,
 * so this route never leaks a hard failure to the merchant onboarding flow.
 */
export async function POST(request: NextRequest) {
  const ctx = getAuthContext(request);
  if (!ctx) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Idempotent short-circuit: wallet already attached to this merchant.
  if (ctx.merchant.walletAddress && ctx.merchant.walletId) {
    return NextResponse.json(
      {
        walletId: ctx.merchant.walletId,
        walletAddress: ctx.merchant.walletAddress,
        blockchain: "SOL",
        source: "existing",
        alreadyExists: true,
      },
      { status: 200 }
    );
  }

  const provisioned = await provisionMerchantWallet(
    ctx.merchant.id,
    ctx.merchant.email
  );

  try {
    db.attachWallet(
      ctx.merchant.id,
      provisioned.walletId,
      provisioned.walletAddress
    );
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to persist wallet to merchant profile.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      walletId: provisioned.walletId,
      walletAddress: provisioned.walletAddress,
      blockchain: provisioned.blockchain,
      source: provisioned.source,
      alreadyExists: false,
    },
    { status: 201 }
  );
}
