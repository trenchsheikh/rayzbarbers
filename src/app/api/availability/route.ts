import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { getServiceById } from "@/lib/services-data";
import {
  getServicePriceForDate,
  getShopAvailability,
} from "@/lib/shop-availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "date and serviceId are required" },
      { status: 400 },
    );
  }

  const service = await getServiceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const settings = await getShopAvailability();
  const priceCents = getServicePriceForDate(
    service.id,
    date,
    service.priceCents,
    settings,
  );
  const slots = await getAvailableSlots(date, service.durationMinutes);
  return NextResponse.json({ slots, priceCents });
}
