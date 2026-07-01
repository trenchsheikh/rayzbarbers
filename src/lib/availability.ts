import { and, inArray, lt, gt } from "drizzle-orm";
import { addDays, addMinutes, format, getDay, isBefore, isSameDay, set } from "date-fns";
import { db, requireDb } from "./db";
import { bookings } from "./db/schema";
import {
  getDefaultHoursForDate,
  getHoursForDate,
  getShopAvailability,
  hasCustomHours,
  hasCustomPrices,
  isDateAvailable,
  isScheduledOpen,
  type DayHours,
} from "./shop-availability";

const SLOT_INTERVAL_MINUTES = 30;
const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export { getDayOptions } from "./shop";

function generateSlotsForDate(
  date: Date,
  durationMinutes: number,
  hours: DayHours | null,
): Date[] {
  if (!hours) return [];

  const slots: Date[] = [];
  let cursor = set(date, {
    hours: hours.open,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const end = set(date, {
    hours: hours.close,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const lastStart = addMinutes(end, -durationMinutes);

  while (isBefore(cursor, lastStart) || cursor.getTime() === lastStart.getTime()) {
    slots.push(new Date(cursor));
    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

function slotWithinHours(startsAt: Date, durationMinutes: number, hours: DayHours) {
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const openMinutes = hours.open * 60;
  const closeMinutes = hours.close * 60;
  const endMinutes = startMinutes + durationMinutes;
  return startMinutes >= openMinutes && endMinutes <= closeMinutes;
}

async function getBookingsForDate(dateStr: string) {
  if (!db) return [];
  const start = new Date(`${dateStr}T00:00:00`);
  const end = addDays(start, 1);
  return requireDb()
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, [...ACTIVE_STATUSES]),
        lt(bookings.startsAt, end),
        gt(
          bookings.startsAt,
          addMinutes(start, -24 * 60),
        ),
      ),
    );
}

function overlaps(
  slotStart: Date,
  durationMinutes: number,
  bookingStart: Date,
  bookingDuration: number,
) {
  const slotEnd = addMinutes(slotStart, durationMinutes);
  const bookingEnd = addMinutes(bookingStart, bookingDuration);
  return slotStart < bookingEnd && slotEnd > bookingStart;
}

export async function getAvailableSlots(dateStr: string, durationMinutes: number) {
  const settings = await getShopAvailability();
  if (!isDateAvailable(dateStr, settings)) return [];

  const hours = getHoursForDate(dateStr, settings);
  const date = new Date(`${dateStr}T12:00:00`);
  const slots = generateSlotsForDate(date, durationMinutes, hours);
  const dayBookings = await getBookingsForDate(dateStr);

  const now = new Date();
  return slots
    .filter((slot) => {
      if (isBefore(slot, now) && !isSameDay(slot, now)) return false;
      if (isBefore(slot, now)) return false;
      return !dayBookings.some((b) =>
        overlaps(slot, durationMinutes, b.startsAt, b.durationMinutes),
      );
    })
    .map((slot) => ({
      label: format(slot, "h:mm a"),
      value: slot.toISOString(),
    }));
}

export async function isSlotAvailable(
  startsAt: Date,
  durationMinutes: number,
  excludeBookingId?: string,
) {
  const dayStr = format(startsAt, "yyyy-MM-dd");
  const settings = await getShopAvailability();
  if (!isDateAvailable(dayStr, settings)) return false;

  const hours = getHoursForDate(dayStr, settings);
  if (!hours || !slotWithinHours(startsAt, durationMinutes, hours)) return false;

  if (!db) return true;
  const dayBookings = await getBookingsForDate(dayStr);
  return !dayBookings
    .filter((b) => b.id !== excludeBookingId)
    .some((b) => overlaps(startsAt, durationMinutes, b.startsAt, b.durationMinutes));
}

export async function getCalendarMonth(year: number, month: number) {
  const settings = await getShopAvailability();

  if (!db) {
    return {
      year,
      month,
      days: [] as CalendarDay[],
      settings,
    };
  }

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);

  const rows = await requireDb()
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, [...ACTIVE_STATUSES]),
        lt(bookings.startsAt, addDays(end, 1)),
        gt(bookings.startsAt, addDays(start, -1)),
      ),
    );

  const days: CalendarDay[] = [];
  const daysInMonth = end.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = format(new Date(year, month, d), "yyyy-MM-dd");
    const dayRows = rows.filter(
      (r) => format(r.startsAt, "yyyy-MM-dd") === date,
    );
    const scheduledOpen = isScheduledOpen(new Date(`${date}T12:00:00`));
    const override = settings.days[date];
    const defaultHours = getDefaultHoursForDate(date);
    const effectiveHours = getHoursForDate(date, settings);
    days.push({
      date,
      booked: dayRows.filter((r) => r.status === "confirmed").length,
      pending: dayRows.filter((r) => r.status === "pending").length,
      available: isDateAvailable(date, settings),
      scheduledOpen,
      hasCustomPrices: hasCustomPrices(date, settings),
      customPrices: override?.prices,
      hasCustomHours: hasCustomHours(date, settings),
      hours: effectiveHours ?? undefined,
      defaultHours: defaultHours ?? undefined,
    });
  }

  const leadingBlanks = (getDay(start) + 6) % 7;

  return { year, month, days, leadingBlanks, settings };
}

export type CalendarDay = {
  date: string;
  booked: number;
  pending: number;
  available: boolean;
  scheduledOpen: boolean;
  hasCustomPrices: boolean;
  customPrices?: Record<string, number>;
  hasCustomHours: boolean;
  hours?: { open: number; close: number };
  defaultHours?: { open: number; close: number };
};
