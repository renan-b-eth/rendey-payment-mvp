import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { sessionCookieValue } from "@/lib/session";
import { provisionMerchantWallet } from "@/lib/circle-wallet";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Business name must be at least 2 characters." },
      { status: 400 }
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (db.findMerchantByEmail(email)) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const { hash, salt } = db.hashPassword(password);

  let merchant: db.MerchantRow;
  try {
    merchant = db.createMerchant({
      name,
      email,
      passwordHash: hash,
      passwordSalt: salt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed." },
      { status: 500 }
    );
  }

  // Auto-provision the merchant's Developer-Controlled Solana wallet
  // (Circle REST → deterministic mock fallback). Never throws.
  const provisioned = await provisionMerchantWallet(merchant.id, merchant.email);
  db.attachWallet(merchant.id, provisioned.walletId, provisioned.walletAddress);

  const session = db.createSession(merchant.id);
  const response = NextResponse.json(
    {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        walletId: provisioned.walletId,
        walletAddress: provisioned.walletAddress,
        createdAt: merchant.createdAt,
      },
      walletSource: provisioned.source,
    },
    { status: 201 }
  );
  const cookie = sessionCookieValue(session);
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    maxAge: cookie.maxAge,
    path: cookie.path,
  });
  return response;
}
