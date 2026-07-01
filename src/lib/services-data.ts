import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { services } from "./db/schema";
import { DEFAULT_SERVICES } from "./shop";
import type { Service } from "./db/schema";

export function fallbackServices(): Service[] {
  return DEFAULT_SERVICES.map((s, i) => ({
    id: `00000000-0000-0000-0000-${String(i + 1).padStart(12, "0")}`,
    slug: s.slug,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    active: true,
  }));
}

export async function listActiveServices(): Promise<Service[]> {
  if (!db) return fallbackServices();
  const rows = await db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.name));
  return rows.length ? rows : fallbackServices();
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  if (!db) return fallbackServices().find((s) => s.id === id);
  const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  return row ?? fallbackServices().find((s) => s.id === id);
}
