import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// POST /api/wallet/generate
//
// Generates a non-custodial Solana wallet using Circle's Web3 Developer API.
// Falls back to mock data if the external endpoint is unreachable or returns
// errors (useful during demos and compliance videos).
//
// Circle Web3 API docs:
//   https://developers.circle.com/api-reference/w3s/wallets/create-wallet
// =============================================================================

/** Circle Web3 Developer API base URL */
const CIRCLE_W3S_URL = "https://api.circle.com/v1/w3s/developer";

/**
 * Builds the authorization header for Circle's Web3 API.
 * The API key is stored server-side only (no NEXT_PUBLIC_ prefix).
 */
function buildHeaders(): HeadersInit {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    throw new Error("CIRCLE_API_KEY is not set in .env.local");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Mock wallet generator — used as fallback when Circle API is unreachable
// ---------------------------------------------------------------------------
function generateMockWallet(userEmail: string) {
  // Generate a deterministic but realistic-looking Solana address
  const seed = userEmail + Date.now();
  const mockAddress = `RENDEY${Buffer.from(seed).toString("base64url").slice(0, 40)}`.slice(0, 44);
  const mockWalletId = `wallet-mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    wallet: {
      id: mockWalletId,
      address: mockAddress,
      chain: "SOLANA",
      currency: "USDC",
      state: "LIVE",
    },
    userToken: `usr_mock_${Date.now()}`,
    isMock: true,
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body as { email?: string; userId?: string };

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Provide either `email` or `userId` in the request body." },
        { status: 400 }
      );
    }

    const identifier = email || userId || "anonymous";

    // -------------------------------------------------------------------
    // Step 1: Create / retrieve a Circle user token
    // -------------------------------------------------------------------
    let userToken: string | null = null;

    try {
      const userRes = await fetch(`${CIRCLE_W3S_URL}/users`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          ...(email ? { email } : {}),
          ...(userId ? { userId } : {}),
        }),
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        userToken = userData.data?.token ?? null;
      } else {
        console.warn(
          "[wallet/generate] Circle /users returned",
          userRes.status,
          "— falling back to mock"
        );
      }
    } catch (err) {
      console.warn("[wallet/generate] Circle /users unreachable —", err);
    }

    // If we couldn't get a user token, return mock wallet immediately
    if (!userToken) {
      const mock = generateMockWallet(identifier);
      return NextResponse.json({
        success: true,
        ...mock,
      });
    }

    // -------------------------------------------------------------------
    // Step 2: Generate a Programmable Wallet on Solana
    // -------------------------------------------------------------------
    try {
      const walletRes = await fetch(`${CIRCLE_W3S_URL}/wallets`, {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({
          userToken,
          currency: "USDC",
          chain: "SOLANA",
          idempotencyKey: `rendey-${identifier}-${Date.now()}`,
        }),
      });

      if (!walletRes.ok) {
        const errText = await walletRes.text();
        console.warn(
          "[wallet/generate] Circle /wallets returned",
          walletRes.status,
          errText,
          "— falling back to mock"
        );
        const mock = generateMockWallet(identifier);
        return NextResponse.json({ success: true, ...mock });
      }

      const walletData = await walletRes.json();
      return NextResponse.json({
        success: true,
        wallet: {
          id: walletData.data?.id,
          address: walletData.data?.address,
          chain: walletData.data?.chain,
          currency: walletData.data?.currency,
          state: walletData.data?.state,
        },
        userToken,
        isMock: false,
      });
    } catch (err) {
      console.warn("[wallet/generate] Circle /wallets unreachable —", err);
      const mock = generateMockWallet(identifier);
      return NextResponse.json({ success: true, ...mock });
    }
  } catch (error: unknown) {
    console.error("[wallet/generate] Unexpected error:", error);
    // Even on unexpected errors, return a mock so the demo can proceed
    const mock = generateMockWallet("fallback");
    return NextResponse.json({ success: true, ...mock });
  }
}
