import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import {
  applyDayUpdates,
  getShopAvailability,
  saveShopAvailability,
} from "@/lib/shop-availability";

const hoursSchema = z.object({
  open: z.number().int().min(0).max(23),
  close: z.number().int().min(1).max(24),
});

const patchSchema = z.object({
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  available: z.boolean().optional(),
  prices: z.record(z.string(), z.number().int().positive()).optional(),
  clearPrices: z.boolean().optional(),
  hours: hoursSchema.optional(),
  clearHours: z.boolean().optional(),
});

export async function GET() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getShopAvailability();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = patchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { dates, available, prices, clearPrices, hours, clearHours } =
    body.data;

  if (hours && hours.close <= hours.open) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 },
    );
  }

  if (
    available === undefined &&
    !prices &&
    !clearPrices &&
    !hours &&
    !clearHours
  ) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const current = await getShopAvailability();
  const settings = applyDayUpdates(current, dates, {
    available,
    prices,
    clearPrices,
    hours,
    clearHours,
  });
  await saveShopAvailability(settings);

  return NextResponse.json({ settings });
}
