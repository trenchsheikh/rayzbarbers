import { type NextRequest } from "next/server";
import { protectAdminRoutes } from "@/lib/admin-middleware";

export async function middleware(request: NextRequest) {
  return protectAdminRoutes(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
