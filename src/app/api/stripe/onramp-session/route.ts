import { NextRequest, NextResponse } from "next/server";

// =============================================================================
// POST /api/stripe/onramp-session
//
// Initializes a Stripe Crypto Onramp session for the user to purchase
// crypto (USDC on Solana) directly. Returns a client_secret that the
// frontend uses with stripe.confirmCryptoPayment().
//
// Stripe docs: https://docs.stripe.com/crypto
// =============================================================================

const STRIPE_API_BASE = "https://api.stripe.com";

/**
 * Builds a Basic Auth header from the Stripe secret key.
 * Stripe expects `sk_test_...` or `sk_live_...` encoded as
 * base64(`sk_...` + ":").
 */
function buildAuthHeader(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set in .env.local");
  }
  const encoded = Buffer.from(`${key}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, amountUsd = 50 } = body as {
      walletAddress?: string;
      amountUsd?: number;
    };

    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }

    // ---- Create a Stripe Checkout Session for Crypto Onramp ----
    // In Stripe's Crypto Onramp flow, you create a Checkout Session
    // with `mode: "crypto"` and the user's wallet address, then return
    // the `client_secret` to the frontend for confirmation.
    //
    // NOTE: As of mid-2024, Stripe Crypto Onramp is available in limited
    // regions. If your Stripe account doesn't have Crypto enabled yet,
    // this endpoint will gracefully return mock data for demo purposes.

    const params = new URLSearchParams({
      mode: "crypto",
      // The amount in cents (e.g., $50.00 = 5000)
      "amount[line_items][0][price_data][currency]": "usd",
      "amount[line_items][0][price_data][unit_amount]": String(
        Math.round(amountUsd * 100)
      ),
      "amount[line_items][0][price_data][product_data][name]": "USDC Purchase",
      // Destination wallet on Solana
      "wallet_address": walletAddress,
      "crypto_currency": "USDC",
      "network": "solana",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?stripe_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?stripe_cancel=true`,
    });

    const stripeRes = await fetch(
      `${STRIPE_API_BASE}/v1/checkout/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const stripeData = await stripeRes.json();

    // If Stripe returns an error (e.g., Crypto Onramp not enabled on account),
    // fall back to mock data so the demo still works.
    if (stripeData.error) {
      console.warn(
        "[stripe/onramp-session] Stripe returned an error (this is expected " +
          "if Crypto Onramp is not enabled on your account):",
        stripeData.error.message
      );

      // Return mock session for demo purposes
      return NextResponse.json({
        success: true,
        mock: true,
        clientSecret: `demo_secret_${Date.now()}`,
        sessionId: `cs_demo_${Date.now()}`,
        message:
          "Stripe Crypto Onramp is not enabled on this account. " +
          "Returning mock session for demo purposes.",
      });
    }

    return NextResponse.json({
      success: true,
      mock: false,
      clientSecret: stripeData.client_secret,
      sessionId: stripeData.id,
      expiresAt: stripeData.expires_at,
    });
  } catch (error: unknown) {
    console.error("[stripe/onramp-session] Error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Graceful fallback — return mock so the frontend demo still works
    return NextResponse.json({
      success: true,
      mock: true,
      clientSecret: `demo_secret_${Date.now()}`,
      sessionId: `cs_demo_${Date.now()}`,
      message: `Stripe error: ${message}. Returning mock session.`,
    });
  }
}
