import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { getServiceById } from "@/lib/services-data";

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

  const slots = await getAvailableSlots(date, service.durationMinutes);
  return NextResponse.json({ slots });
}
