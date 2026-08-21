// =============================================================================
// Valence — Request Session Helpers (Server-only)
//
// Provides helpers for reading the authenticated merchant from the current
// request and for building Set-Cookie headers for login / logout responses.
// =============================================================================

import type { NextRequest } from "next/server";
import * as db from "./db";

export const SESSION_COOKIE = "valence_session";
export const SESSION_TTL_MS = 7 * 24 * 3600_000; // 7 days

export interface PublicMerchant {
  id: string;
  name: string;
  email: string;
  walletId: string | null;
  walletAddress: string | null;
  createdAt: number;
}

export interface AuthContext {
  merchant: PublicMerchant;
  session: db.SessionRow;
}

/**
 * Read the authenticated merchant + session from a request.
 * Returns `null` when not authenticated or when the session has expired.
 */
export function getAuthContext(request: NextRequest): AuthContext | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = db.findSessionByToken(token);
  if (!session) return null;

  const merchant = db.findMerchantById(session.userId);
  if (!merchant) return null;

  const { passwordHash: _ph, passwordSalt: _ps, ...pub } = merchant;
  return { merchant: pub as PublicMerchant, session };
}

/**
 * Build the authenticated session cookie value (as used by NextResponse).
 * Call after issuing a new `db.createSession()`.
 */
export function sessionCookieValue(session: db.SessionRow): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  path: string;
} {
  return {
    name: SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    path: "/",
  };
}

/**
 * Build a cookie that immediately clears the session cookie (logout).
 */
export function clearSessionCookieValue(): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  path: string;
} {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  };
}
