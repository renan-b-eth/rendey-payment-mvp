import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { SESSION_COOKIE, clearSessionCookieValue } from "@/lib/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      db.deleteSession(token);
    } catch {
      // Clearing the cookie is what matters — swallow store errors.
    }
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  const cookie = clearSessionCookieValue();
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    sameSite: cookie.sameSite,
    secure: cookie.secure,
    maxAge: cookie.maxAge,
    path: cookie.path,
  });
  return response;
}
