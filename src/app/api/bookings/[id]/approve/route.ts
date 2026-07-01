import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import {
  sendBookingApproved,
  sendBookingDeclined,
} from "@/lib/notifications";
import { getServiceById } from "@/lib/services-data";
import { capturePaymentIntent, cancelPaymentIntent } from "@/lib/stripe";
import { getAdminUser } from "@/lib/admin-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = requireDb();
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 });
  }

  if (
    booking.paymentMethod === "online" &&
    booking.stripePaymentIntentId
  ) {
    try {
      await capturePaymentIntent(booking.stripePaymentIntentId);
    } catch (err) {
      console.error(err);
      return NextResponse.json(
        { error: "Payment capture failed. Check Stripe dashboard." },
        { status: 402 },
      );
    }
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "confirmed" })
    .where(eq(bookings.id, id))
    .returning();

  const service = await getServiceById(booking.serviceId);
  if (service) await sendBookingApproved(updated, service);

  return NextResponse.json({ booking: updated });
}
