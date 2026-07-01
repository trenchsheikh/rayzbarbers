import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/admin-auth";

export async function protectAdminRoutes(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname.startsWith("/admin/login");
  const isAdmin = pathname.startsWith("/admin");

  if (!isAdmin) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const user = await verifySessionToken(token);

  if (isLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  if (!isLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
