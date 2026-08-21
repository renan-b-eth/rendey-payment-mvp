import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { sessionCookieValue } from "@/lib/session";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const merchant = db.findMerchantByEmail(email);
  // Constant-shape failure message — avoids user-enumeration side-channel.
  const invalidResponse = () =>
    NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );

  if (!merchant) return invalidResponse();

  const ok = db.verifyPassword(
    password,
    merchant.passwordSalt,
    merchant.passwordHash
  );
  if (!ok) return invalidResponse();

  const session = db.createSession(merchant.id);
  const response = NextResponse.json(
    {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        walletId: merchant.walletId,
        walletAddress: merchant.walletAddress,
        createdAt: merchant.createdAt,
      },
    },
    { status: 200 }
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
