import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createSessionToken,
  getAdminCredentials,
  getSessionCookieOptions,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!verifyAdminPassword(username, password)) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  const creds = getAdminCredentials();
  const token = await createSessionToken(creds.username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getSessionCookieOptions());
  return response;
}
