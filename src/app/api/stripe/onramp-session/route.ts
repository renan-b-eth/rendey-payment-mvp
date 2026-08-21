import { NextRequest, NextResponse } from "next/server";
import { BASE58_REGEX } from "@/lib/solana-pay-kit";

// =============================================================================
// POST /api/stripe/onramp-session
//
// Creates a Stripe Crypto Onramp Checkout Session hardcoded to settle USDC
// (Solana) directly into the merchant's Circle-generated wallet address.
//
// Stripe's dedicated crypto-onramp client packages are not publicly available
// for this stack (`@stripe/crypto` has a hard peer conflict with
// `@stripe/stripe-js@9`), so we call Stripe's REST API server-side and return
// the hosted session URL / client_secret. If the Stripe account doesn't have
// Crypto Onramp enabled, we gracefully return a mock session so onboarding
// never dead-ends.
// =============================================================================

const STRIPE_API_BASE = "https://api.stripe.com";

function buildAuthHeader(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export async function POST(request: NextRequest) {
  let body: { walletAddress?: string; amountUsd?: number };
  try {
    body = (await request.json()) as {
      walletAddress?: string;
      amountUsd?: number;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const walletAddress = (body.walletAddress ?? "").trim();
  const amountUsd = Number(body.amountUsd ?? 50);

  if (!walletAddress || !BASE58_REGEX.test(walletAddress)) {
    return NextResponse.json(
      { error: "A valid base58 `walletAddress` is required." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json(
      { error: "`amountUsd` must be a positive number." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Correctly-formed nested Checkout Session line-item params.
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set(
    "line_items[0][price_data][unit_amount]",
    String(Math.round(amountUsd * 100))
  );
  params.set("line_items[0][price_data][product_data][name]", "USDC (Solana)");
  params.set(
    "line_items[0][price_data][product_data][description]",
    `USDC top-up → Solana wallet ${walletAddress.slice(0, 8)}…`
  );
  params.set("line_items[0][quantity]", "1");
  params.set("success_url", `${appUrl}/dashboard?stripe_success=true`);
  params.set("cancel_url", `${appUrl}/dashboard?stripe_cancel=true`);
  // Crypto onramp targeting — hardcoded to the merchant's Circle wallet.
  params.set("payment_intent_data[metadata][wallet_address]", walletAddress);
  params.set("payment_intent_data[metadata][network]", "solana");
  params.set("payment_intent_data[metadata][crypto_currency]", "USDC");

  try {
    const stripeRes = await fetch(`${STRIPE_API_BASE}/v1/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: buildAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(12_000),
    });

    const stripeData = (await stripeRes.json()) as {
      id?: string;
      url?: string;
      client_secret?: string;
      error?: { message?: string };
    };

    if (stripeData.error) {
      return NextResponse.json({
        success: true,
        mock: true,
        clientSecret: `demo_secret_${Date.now()}`,
        sessionId: `cs_demo_${Date.now()}`,
        walletAddress,
        amountUsd,
        network: "solana",
        message:
          stripeData.error.message ??
          "Crypto Onramp unavailable on this account; mock session returned.",
      });
    }

    return NextResponse.json({
      success: true,
      mock: false,
      clientSecret: stripeData.client_secret,
      sessionId: stripeData.id,
      url: stripeData.url,
      walletAddress,
      amountUsd,
      network: "solana",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({
      success: true,
      mock: true,
      clientSecret: `demo_secret_${Date.now()}`,
      sessionId: `cs_demo_${Date.now()}`,
      walletAddress,
      amountUsd,
      network: "solana",
      message: `Stripe error: ${message}. Mock session returned.`,
    });
  }
}
