import { and, eq, inArray, lt, gt } from "drizzle-orm";
import { addDays, addMinutes, format, isBefore, isSameDay, set } from "date-fns";
import { db, requireDb } from "./db";
import { bookings } from "./db/schema";
import { SHOP_HOURS } from "./shop";

const SLOT_INTERVAL_MINUTES = 30;
const ACTIVE_STATUSES = ["pending", "confirmed"] as const;

export { getDayOptions } from "./shop";

function generateSlotsForDate(date: Date, durationMinutes: number): Date[] {
  const day = date.getDay();
  const hours = SHOP_HOURS[day as keyof typeof SHOP_HOURS];
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
  const date = new Date(`${dateStr}T12:00:00`);
  const slots = generateSlotsForDate(date, durationMinutes);
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
  if (!db) return true;
  const dayStr = format(startsAt, "yyyy-MM-dd");
  const dayBookings = await getBookingsForDate(dayStr);
  return !dayBookings
    .filter((b) => b.id !== excludeBookingId)
    .some((b) => overlaps(startsAt, durationMinutes, b.startsAt, b.durationMinutes));
}

export async function getCalendarMonth(year: number, month: number) {
  if (!db) return { days: [] as { date: string; booked: number; pending: number }[] };

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

  const days: { date: string; booked: number; pending: number }[] = [];
  const daysInMonth = end.getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = format(new Date(year, month, d), "yyyy-MM-dd");
    const dayRows = rows.filter(
      (r) => format(r.startsAt, "yyyy-MM-dd") === date,
    );
    days.push({
      date,
      booked: dayRows.filter((r) => r.status === "confirmed").length,
      pending: dayRows.filter((r) => r.status === "pending").length,
    });
  }
  return { days };
}
