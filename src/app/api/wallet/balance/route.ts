import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { USDC_MAINNET_MINT, BASE58_REGEX } from "@/lib/solana-pay-kit";

const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

let connection: Connection | null = null;
function getConnection(): Connection {
  if (!connection) connection = new Connection(RPC_URL, "confirmed");
  return connection;
}

interface RPCTokenAccountsResponse {
  result?: {
    value?: Array<{
      account?: {
        data?: {
          parsed?: {
            info?: { mint?: string; tokenAmount?: { uiAmount?: number } };
          };
        };
      };
    }>;
  };
}

/**
 * GET /api/wallet/balance?address=<base58>
 *
 * Returns the merchant's USDC (mainnet mint EPjFW…) balance over Helius.
 * Primary: classic web3.js `getParsedTokenAccountsByOwner`.
 * Fallback: raw JSON-RPC `getTokenAccountsByOwner` (jsonParsed).
 * Never throws — on failure returns `{ usdc: 0 }` with a flag.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = (searchParams.get("address") ?? "").trim();

  if (!address || !BASE58_REGEX.test(address)) {
    return NextResponse.json(
      { error: "A valid base58 `address` query param is required." },
      { status: 400 }
    );
  }

  const owner = new PublicKey(address);
  const mint = new PublicKey(USDC_MAINNET_MINT);

  // Primary path — classic web3.js parsed accounts.
  try {
    const accounts = await getConnection().getParsedTokenAccountsByOwner(
      owner,
      { mint }
    );
    let total = 0;
    for (const { account } of accounts.value) {
      const parsed = account.data.parsed as {
        info?: { tokenAmount?: { uiAmount?: number | null } };
      };
      total += parsed?.info?.tokenAmount?.uiAmount ?? 0;
    }
    return NextResponse.json(
      { usdc: round6(total), address, mint: USDC_MAINNET_MINT, source: "rpc" },
      { status: 200 }
    );
  } catch {
    // fall through to raw JSON-RPC
  }

  // Fallback path — raw JSON-RPC jsonParsed.
  try {
    const res = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "valence-balance",
        method: "getTokenAccountsByOwner",
        params: [
          address,
          { mint: USDC_MAINNET_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await res.json()) as RPCTokenAccountsResponse;
    const value = json.result?.value ?? [];
    let total = 0;
    for (const entry of value) {
      const amt =
        entry?.account?.data?.parsed?.info?.tokenAmount?.uiAmount ?? 0;
      total += amt;
    }
    return NextResponse.json(
      {
        usdc: round6(total),
        address,
        mint: USDC_MAINNET_MINT,
        source: "rpc-jsonparsed",
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        usdc: 0,
        address,
        mint: USDC_MAINNET_MINT,
        source: "unavailable",
        error: err instanceof Error ? err.message : "RPC unavailable",
      },
      { status: 200 }
    );
  }
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
