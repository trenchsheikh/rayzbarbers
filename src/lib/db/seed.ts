import "dotenv/config";
import { eq } from "drizzle-orm";
import { requireDb } from "./index";
import { services, shopSettings } from "./schema";
import { DEFAULT_SERVICES, SHOP_INFO } from "../shop";
import { EMPTY_AVAILABILITY } from "../shop-availability";

async function seed() {
  const db = requireDb();

  for (const svc of DEFAULT_SERVICES) {
    await db
      .insert(services)
      .values({
        slug: svc.slug,
        name: svc.name,
        durationMinutes: svc.durationMinutes,
        priceCents: svc.priceCents,
        active: true,
      })
      .onConflictDoUpdate({
        target: services.slug,
        set: {
          name: svc.name,
          durationMinutes: svc.durationMinutes,
          priceCents: svc.priceCents,
          active: true,
        },
      });
  }

  await db
    .insert(shopSettings)
    .values({
      key: "info",
      value: SHOP_INFO,
    })
    .onConflictDoUpdate({
      target: shopSettings.key,
      set: { value: SHOP_INFO },
    });

  await db
    .insert(shopSettings)
    .values({
      key: "availability",
      value: EMPTY_AVAILABILITY,
    })
    .onConflictDoNothing();

  const existing = await db.select().from(services);
  console.log(`Seeded ${existing.length} services.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
