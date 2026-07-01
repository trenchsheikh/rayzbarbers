import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDb } from "@/lib/db";
import { services } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/supabase/server";
import { updateServicePriceSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = updateServicePriceSchema.parse(await request.json());
    const db = requireDb();
    const [updated] = await db
      .update(services)
      .set({ priceCents: body.priceCents })
      .where(eq(services.id, body.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    return NextResponse.json({ service: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    throw err;
  }
}
