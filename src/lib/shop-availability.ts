import { eq } from "drizzle-orm";
import { db, requireDb } from "./db";
import { shopSettings } from "./db/schema";
import { SHOP_HOURS } from "./shop";
import type { DayHours } from "./day-hours";

export type { DayHours } from "./day-hours";
export { formatHourLabel, formatHoursRange, hoursDuration } from "./day-hours";

export type DayOverride = {
  /** When set, overrides the weekly schedule for this date. */
  available?: boolean;
  /** Per-service price overrides in pence. */
  prices?: Record<string, number>;
  /** Custom open/close hours (24h clock, same as SHOP_HOURS). */
  hours?: DayHours;
};

export type ShopAvailability = {
  days: Record<string, DayOverride>;
};

export const AVAILABILITY_SETTINGS_KEY = "availability";

export const EMPTY_AVAILABILITY: ShopAvailability = { days: {} };

export function isScheduledOpen(date: Date) {
  const hours = SHOP_HOURS[date.getDay() as keyof typeof SHOP_HOURS];
  return hours !== null;
}

export function getDefaultHoursForDate(dateStr: string): DayHours | null {
  const date = new Date(`${dateStr}T12:00:00`);
  const hours = SHOP_HOURS[date.getDay() as keyof typeof SHOP_HOURS];
  return hours ? { open: hours.open, close: hours.close } : null;
}

export function getHoursForDate(
  dateStr: string,
  settings: ShopAvailability = EMPTY_AVAILABILITY,
): DayHours | null {
  if (!isDateAvailable(dateStr, settings)) return null;
  const override = settings.days[dateStr]?.hours;
  if (override) return override;
  return getDefaultHoursForDate(dateStr);
}

export function hasCustomHours(
  dateStr: string,
  settings: ShopAvailability = EMPTY_AVAILABILITY,
) {
  return !!settings.days[dateStr]?.hours;
}

function migrateLegacy(raw: unknown): ShopAvailability {
  if (!raw || typeof raw !== "object") return EMPTY_AVAILABILITY;

  const record = raw as Record<string, unknown>;
  if (record.days && typeof record.days === "object") {
    return { days: record.days as Record<string, DayOverride> };
  }

  const days: Record<string, DayOverride> = {};
  for (const dateStr of Array.isArray(record.closedDates) ? record.closedDates : []) {
    if (typeof dateStr === "string") days[dateStr] = { available: false };
  }
  for (const dateStr of Array.isArray(record.openDates) ? record.openDates : []) {
    if (typeof dateStr === "string") days[dateStr] = { available: true };
  }
  return { days };
}

export function normalizeAvailability(settings: ShopAvailability): ShopAvailability {
  const days: Record<string, DayOverride> = {};
  for (const [dateStr, override] of Object.entries(settings.days)) {
    const cleaned: DayOverride = {};
    if (override.available !== undefined) cleaned.available = override.available;
    if (override.prices && Object.keys(override.prices).length > 0) {
      cleaned.prices = { ...override.prices };
    }
    if (
      override.hours &&
      Number.isFinite(override.hours.open) &&
      Number.isFinite(override.hours.close) &&
      override.hours.close > override.hours.open
    ) {
      cleaned.hours = {
        open: override.hours.open,
        close: override.hours.close,
      };
    }
    if (Object.keys(cleaned).length > 0) days[dateStr] = cleaned;
  }
  return { days };
}

export function isDateAvailable(
  dateStr: string,
  settings: ShopAvailability = EMPTY_AVAILABILITY,
) {
  const override = settings.days[dateStr];
  if (override?.available === false) return false;
  if (override?.available === true) return true;
  return isScheduledOpen(new Date(`${dateStr}T12:00:00`));
}

export function getServicePriceForDate(
  serviceId: string,
  dateStr: string,
  basePriceCents: number,
  settings: ShopAvailability = EMPTY_AVAILABILITY,
) {
  return settings.days[dateStr]?.prices?.[serviceId] ?? basePriceCents;
}

export function hasCustomPrices(
  dateStr: string,
  settings: ShopAvailability = EMPTY_AVAILABILITY,
) {
  const prices = settings.days[dateStr]?.prices;
  return !!prices && Object.keys(prices).length > 0;
}

export async function getShopAvailability(): Promise<ShopAvailability> {
  if (!db) return EMPTY_AVAILABILITY;

  const rows = await requireDb()
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.key, AVAILABILITY_SETTINGS_KEY))
    .limit(1);

  return normalizeAvailability(migrateLegacy(rows[0]?.value));
}

export async function saveShopAvailability(settings: ShopAvailability) {
  const normalized = normalizeAvailability(settings);

  await requireDb()
    .insert(shopSettings)
    .values({ key: AVAILABILITY_SETTINGS_KEY, value: normalized })
    .onConflictDoUpdate({
      target: shopSettings.key,
      set: { value: normalized },
    });

  return normalized;
}

export function applyDayUpdates(
  settings: ShopAvailability,
  dates: string[],
  update: {
    available?: boolean;
    prices?: Record<string, number | null>;
    clearPrices?: boolean;
    hours?: DayHours | null;
    clearHours?: boolean;
  },
): ShopAvailability {
  const days = { ...settings.days };

  for (const dateStr of dates) {
    const current: DayOverride = { ...(days[dateStr] ?? {}) };

    if (update.available !== undefined) {
      const scheduledOpen = isScheduledOpen(new Date(`${dateStr}T12:00:00`));
      if (update.available === scheduledOpen) delete current.available;
      else current.available = update.available;
    }

    if (update.clearPrices) {
      delete current.prices;
    } else if (update.prices) {
      const nextPrices = { ...(current.prices ?? {}) };
      for (const [serviceId, cents] of Object.entries(update.prices)) {
        if (cents === null) delete nextPrices[serviceId];
        else nextPrices[serviceId] = cents;
      }
      if (Object.keys(nextPrices).length === 0) delete current.prices;
      else current.prices = nextPrices;
    }

    if (update.clearHours) {
      delete current.hours;
    } else if (update.hours) {
      const defaultHours = getDefaultHoursForDate(dateStr);
      if (
        defaultHours &&
        update.hours.open === defaultHours.open &&
        update.hours.close === defaultHours.close
      ) {
        delete current.hours;
      } else {
        current.hours = update.hours;
      }
    }

    if (Object.keys(current).length === 0) delete days[dateStr];
    else days[dateStr] = current;
  }

  return { days };
}
