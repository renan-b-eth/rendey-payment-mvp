// =============================================================================
// Solana Runtime — Valence Payment Platform
//
// Cluster-aware connection singleton and USDC mint registry. Shared by the
// Solana Pay checkout flow (client) and server-side settlement logic.
//
// NOTE: `getSolanaCluster` is defined in ./env but RE-EXPORTED here because
// consumers (e.g. SolanaPayCheckout) import it from "@/lib/solana".
// =============================================================================

import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  getSolanaCluster,
  getSolanaRpcUrl,
  type SolanaCluster,
} from "./env";

export { getSolanaCluster } from "./env";
export type { SolanaCluster } from "./env";

/** Circle-issued USDC SPL token mints, per cluster. */
export const USDC_MINT: Record<SolanaCluster, string> = {
  "mainnet-beta": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

let connection: Connection | null = null;

/** Lazily-created shared Connection (commitment: confirmed). */
export function getSolanaConnection(): Connection {
  if (!connection) {
    const endpoint = getSolanaRpcUrl() ?? clusterApiUrl(getSolanaCluster());
    connection = new Connection(endpoint, "confirmed");
  }
  return connection;
}

/** USDC mint for the currently configured cluster. */
export function getUsdcMint(): PublicKey {
  return new PublicKey(USDC_MINT[getSolanaCluster()]);
}

/** Base58/length validation for Solana public keys. */
export function isValidSolanaAddress(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

// --- Cluster-aware UI helpers ---------------------------------------------------

/** True when settling on Solana mainnet-beta. */
export function isMainnet(): boolean {
  return getSolanaCluster() === "mainnet-beta";
}

/** Uppercase badge label for headers/status strips, e.g. "SOLANA MAINNET". */
export function getClusterLabel(): string {
  return isMainnet() ? "SOLANA MAINNET" : "SOLANA DEVNET";
}

/**
 * Solscan URL for the given path ("/tx/<sig>", "/account/<addr>", …).
 * Mainnet uses the bare URL; devnet appends the `?cluster=devnet` param so
 * explorer links never 404 outside mainnet.
 */
export function getSolscanUrl(path: string): string {
  const base = `https://solscan.io${path}`;
  return isMainnet() ? base : `${base}?cluster=devnet`;
}
