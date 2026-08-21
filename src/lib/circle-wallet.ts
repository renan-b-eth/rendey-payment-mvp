/**
 * Valence — server-side Circle wallet provisioning.
 *
 * Creates a Developer-Controlled Wallet on Solana Mainnet via the Circle
 * Web3 Services REST API. If Circle is unreachable or rejects the request,
 * a deterministic mock wallet is generated so the merchant flow never
 * dead-ends (clearly flagged with `source: "mock"`).
 */

import { generateMockSolanaAddress } from "./db";

const CIRCLE_API_BASE = "https://api.circle.com";

export interface ProvisionedWallet {
  walletId: string;
  walletAddress: string;
  blockchain: string;
  source: "circle" | "mock";
}

interface CircleWalletsResponse {
  data?: {
    wallets?: Array<{
      id?: string;
      address?: string;
      blockchain?: string;
      state?: string;
    }>;
  };
}

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

async function createWalletViaCircleRest(
  merchantId: string
): Promise<ProvisionedWallet | null> {
  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  if (!apiKey || !entitySecret) return null;

  const walletSetId = process.env.CIRCLE_WALLET_SET_ID;
  if (!walletSetId) return null;

  try {
    const response = await fetch(`${CIRCLE_API_BASE}/v1/w3s/developer/wallets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idempotencyKey: merchantId,
        blockchains: ["SOL"],
        count: 1,
        entitySecretCiphertext: entitySecret,
        walletSetId,
        accountType: "EOA",
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as CircleWalletsResponse;
    const wallet = payload.data?.wallets?.[0];
    const address = wallet?.address;
    const id = wallet?.id;

    if (!address || !id || !BASE58_REGEX.test(address)) return null;

    return {
      walletId: id,
      walletAddress: address,
      blockchain: wallet?.blockchain ?? "SOL",
      source: "circle",
    };
  } catch {
    return null;
  }
}

/**
 * Provision (or mock-provision) the merchant's Solana wallet.
 * Never throws — always returns a usable address.
 */
export async function provisionMerchantWallet(
  merchantId: string,
  merchantEmail: string
): Promise<ProvisionedWallet> {
  const viaCircle = await createWalletViaCircleRest(merchantId);
  if (viaCircle) return viaCircle;

  const seed = `${merchantId}:${merchantEmail}:valence-sol-mainnet`;
  return {
    walletId: `mock_wallet_${merchantId.slice(0, 8)}`,
    walletAddress: generateMockSolanaAddress(seed),
    blockchain: "SOL",
    source: "mock",
  };
}
