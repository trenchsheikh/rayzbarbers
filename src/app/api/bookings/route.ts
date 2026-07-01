import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { isSlotAvailable } from "@/lib/availability";
import { getServicePriceForDate, getShopAvailability } from "@/lib/shop-availability";
import { requireDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import {
  sendBookingReceived,
} from "@/lib/notifications";
import { getServiceById } from "@/lib/services-data";
import { createManualCaptureIntent } from "@/lib/stripe";
import { getAdminUser } from "@/lib/admin-auth";
import { createBookingSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const db = requireDb();
  const query = db.select().from(bookings).orderBy(desc(bookings.startsAt));

  const rows = status
    ? await query.where(eq(bookings.status, status))
    : await query;

  return NextResponse.json({ bookings: rows });
}

export async function POST(request: Request) {
  try {
    const body = createBookingSchema.parse(await request.json());
    const service = await getServiceById(body.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const startsAt = new Date(body.startsAt);
    const available = await isSlotAvailable(startsAt, service.durationMinutes);
    if (!available) {
      return NextResponse.json(
        { error: "That time slot is no longer available" },
        { status: 409 },
      );
    }

    const settings = await getShopAvailability();
    const priceCents = getServicePriceForDate(
      service.id,
      format(startsAt, "yyyy-MM-dd"),
      service.priceCents,
      settings,
    );

    let stripePaymentIntentId = body.stripePaymentIntentId ?? null;
    let clientSecret: string | null = null;

    if (body.paymentMethod === "online") {
      if (!stripePaymentIntentId) {
        const intent = await createManualCaptureIntent(priceCents, {
          serviceId: service.id,
          customerName: body.customerName,
        });
        stripePaymentIntentId = intent.id;
        clientSecret = intent.client_secret;
      }
    }

    const db = requireDb();
    const [booking] = await db
      .insert(bookings)
      .values({
        serviceId: service.id,
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.trim(),
        customerEmail: body.customerEmail?.trim() || null,
        startsAt,
        durationMinutes: service.durationMinutes,
        paymentMethod: body.paymentMethod,
        status: "pending",
        stripePaymentIntentId,
      })
      .returning();

    await sendBookingReceived(booking, service);

    return NextResponse.json({
      booking,
      clientSecret,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create booking" },
      { status: 500 },
    );
  }
}
