"use client";

import {
  addDays,
  addWeeks,
  format,
  isToday,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { formatHourLabel } from "@/lib/day-hours";
import { cn } from "@/lib/utils";

export type UpcomingBooking = {
  id: string;
  customerName: string;
  serviceName?: string;
  startsAt: Date | string;
  durationMinutes: number;
  paymentMethod: string;
};

const GRID_START_HOUR = 8;
const GRID_END_HOUR = 21;
const HOUR_HEIGHT = 52;

type UpcomingBookingsCalendarProps = {
  bookings: UpcomingBooking[];
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function bookingPosition(startsAt: Date, durationMinutes: number) {
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const gridStart = GRID_START_HOUR * 60;
  const gridTotal = (GRID_END_HOUR - GRID_START_HOUR) * 60;
  const top = ((startMinutes - gridStart) / gridTotal) * 100;
  const height = (durationMinutes / gridTotal) * 100;
  return {
    top: `${Math.max(0, top)}%`,
    height: `${Math.min(Math.max(height, 4), 100 - Math.max(0, top))}%`,
  };
}

function paymentLabel(method: string) {
  return method === "online" ? "Paid online" : "Cash";
}

export function UpcomingBookingsCalendar({
  bookings,
}: UpcomingBookingsCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const hours = useMemo(
    () =>
      Array.from(
        { length: GRID_END_HOUR - GRID_START_HOUR },
        (_, i) => GRID_START_HOUR + i,
      ),
    [],
  );

  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT;

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, UpcomingBooking[]>();
    for (const day of weekDays) {
      map.set(format(day, "yyyy-MM-dd"), []);
    }
    for (const booking of bookings) {
      const start = toDate(booking.startsAt);
      const key = format(start, "yyyy-MM-dd");
      if (map.has(key)) map.get(key)!.push(booking);
    }
    for (const [, list] of map) {
      list.sort(
        (a, b) =>
          toDate(a.startsAt).getTime() - toDate(b.startsAt).getTime(),
      );
    }
    return map;
  }, [bookings, weekDays]);

  const weekBookingsCount = useMemo(
    () =>
      [...bookingsByDay.values()].reduce((sum, list) => sum + list.length, 0),
    [bookingsByDay],
  );

  const weekLabel = `${format(weekDays[0], "d MMM")} – ${format(weekDays[6], "d MMM yyyy")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekStart((d) => addWeeks(d, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Previous week"
          >
            ‹
          </button>
          <p className="min-w-[11rem] text-center font-oswald text-lg font-semibold">
            {weekLabel}
          </p>
          <button
            type="button"
            onClick={() => setWeekStart((d) => addWeeks(d, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Next week"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-rayz-gold/40 hover:text-foreground"
        >
          This week
        </button>
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No confirmed bookings yet.
        </p>
      ) : weekBookingsCount === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No confirmed bookings this week. Try another week.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border">
              <div />
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "border-l border-border px-2 py-3 text-center",
                    isToday(day) && "bg-rayz-gold/5",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-oswald text-lg font-semibold",
                      isToday(day) && "text-rayz-gold",
                    )}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[3.5rem_repeat(7,1fr)]">
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground"
                    style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const dayBookings = bookingsByDay.get(dayKey) ?? [];

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "relative border-l border-border",
                      isToday(day) && "bg-rayz-gold/[0.03]",
                    )}
                    style={{ height: gridHeight }}
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="absolute inset-x-0 border-t border-border/60"
                        style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT }}
                      />
                    ))}

                    {dayBookings.map((booking) => {
                      const start = toDate(booking.startsAt);
                      const style = bookingPosition(
                        start,
                        booking.durationMinutes,
                      );
                      return (
                        <div
                          key={booking.id}
                          className="absolute inset-x-1 z-10 overflow-hidden rounded-md border border-rayz-gold/40 bg-rayz-gold/15 px-1.5 py-1"
                          style={style}
                          title={`${booking.customerName} · ${booking.serviceName} · ${format(start, "h:mm a")}`}
                        >
                          <p className="truncate text-[10px] font-bold leading-tight">
                            {format(start, "h:mm a")}
                          </p>
                          <p className="truncate text-[11px] font-semibold leading-tight">
                            {booking.customerName}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {booking.serviceName}
                          </p>
                          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                            {paymentLabel(booking.paymentMethod)} ·{" "}
                            {booking.durationMinutes}m
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {bookings.length > 0 && weekBookingsCount > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            This week
          </p>
          <div className="space-y-2">
            {[...bookingsByDay.entries()]
              .filter(([, list]) => list.length > 0)
              .map(([dateKey, list]) => (
                <div
                  key={dateKey}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <p className="mb-2 text-sm font-semibold">
                    {format(new Date(`${dateKey}T12:00:00`), "EEEE d MMMM")}
                  </p>
                  <div className="space-y-2">
                    {list.map((booking) => {
                      const start = toDate(booking.startsAt);
                      return (
                        <div
                          key={booking.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <div>
                            <span className="font-semibold text-rayz-gold">
                              {format(start, "h:mm a")}
                            </span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="font-medium">
                              {booking.customerName}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              — {booking.serviceName}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {booking.durationMinutes} min ·{" "}
                            {paymentLabel(booking.paymentMethod)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
