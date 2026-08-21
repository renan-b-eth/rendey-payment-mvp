import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/session";

export async function GET(request: NextRequest) {
  const ctx = getAuthContext(request);
  if (!ctx) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  return NextResponse.json({ merchant: ctx.merchant }, { status: 200 });
}
