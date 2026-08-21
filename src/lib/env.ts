// =============================================================================
// Environment Validation — Valence Payment Platform
//
// Fail-fast, centralized accessors for environment variables.
//
// NOTE: NEXT_PUBLIC_* values MUST be read via direct property access
// (process.env.NEXT_PUBLIC_FOO) so Next.js can inline them into the client
// bundle at build time — dynamic access (process.env[name]) does NOT work
// in the browser.
// =============================================================================

// --- Stripe -------------------------------------------------------------------

/** Server-only. Throws at request time if misconfigured. */
export function getStripeSecretKey(): string {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value || value.trim() === "") {
    throw new Error(
      "[Valence] Missing required environment variable STRIPE_SECRET_KEY. " +
        "Set it in your deployment environment (see .env.example)."
    );
  }
  return value;
}

/** Client-safe (inlined at build time). */
export function getStripePublishableKey(): string {
  const value = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!value || value.trim() === "") {
    throw new Error(
      "[Valence] Missing required environment variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
    );
  }
  return value;
}

// --- Solana -------------------------------------------------------------------

export type SolanaCluster = "mainnet-beta" | "devnet";

export function getSolanaCluster(): SolanaCluster {
  const raw = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";
  if (raw !== "mainnet-beta" && raw !== "devnet") {
    throw new Error(
      `[Valence] Invalid NEXT_PUBLIC_SOLANA_CLUSTER "${raw}". ` +
        'Expected "mainnet-beta" or "devnet".'
    );
  }
  return raw;
}

/** Optional dedicated RPC endpoint; falls back to the public cluster RPC. */
export function getSolanaRpcUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  return value && value.trim() !== "" ? value : undefined;
}
