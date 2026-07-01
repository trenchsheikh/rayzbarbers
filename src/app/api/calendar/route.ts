import { NextResponse } from "next/server";
import { getCalendarMonth } from "@/lib/availability";
import { getAdminUser } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth());

  const data = await getCalendarMonth(year, month);
  return NextResponse.json(data);
}
