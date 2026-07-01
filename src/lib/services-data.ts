import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { services } from "./db/schema";
import { DEFAULT_SERVICES } from "./shop";
import type { Service } from "./db/schema";

const FALLBACK_ID_PREFIX = "00000000-0000-0000-0000-";

export function fallbackServices(): Service[] {
  return DEFAULT_SERVICES.map((s, i) => ({
    id: `${FALLBACK_ID_PREFIX}${String(i + 1).padStart(12, "0")}`,
    slug: s.slug,
    name: s.name,
    durationMinutes: s.durationMinutes,
    priceCents: s.priceCents,
    active: true,
  }));
}

function fallbackSlugForId(id: string): string | undefined {
  if (!id.startsWith(FALLBACK_ID_PREFIX)) return undefined;
  const index = parseInt(id.slice(FALLBACK_ID_PREFIX.length), 10) - 1;
  return DEFAULT_SERVICES[index]?.slug;
}

async function findServiceInDb(id: string) {
  if (!db) return undefined;

  const [byId] = await db
    .select()
    .from(services)
    .where(eq(services.id, id))
    .limit(1);
  if (byId) return byId;

  const slug = fallbackSlugForId(id);
  if (!slug) return undefined;

  const [bySlug] = await db
    .select()
    .from(services)
    .where(eq(services.slug, slug))
    .limit(1);
  return bySlug;
}

export async function listActiveServices(): Promise<Service[]> {
  if (!db) return fallbackServices();
  try {
    const rows = await db
      .select()
      .from(services)
      .where(eq(services.active, true))
      .orderBy(asc(services.name));
    return rows.length ? rows : fallbackServices();
  } catch (err) {
    console.error("listActiveServices failed, using defaults:", err);
    return fallbackServices();
  }
}

export async function getServiceById(id: string): Promise<Service | undefined> {
  if (!db) return fallbackServices().find((s) => s.id === id);
  try {
    const row = await findServiceInDb(id);
    return row ?? fallbackServices().find((s) => s.id === id);
  } catch (err) {
    console.error("getServiceById failed, using defaults:", err);
    return fallbackServices().find((s) => s.id === id);
  }
}
