"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { CalendarDay } from "@/lib/availability";
import type { Service } from "@/lib/db/schema";
import { CURRENCY_SYMBOL, formatPrice } from "@/lib/shop";
import {
  formatHourLabel,
  formatHoursRange,
  hoursDuration,
} from "@/lib/day-hours";
import { cn } from "@/lib/utils";

const START_HOURS = [8, 9, 10, 11, 12] as const;
const DURATION_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type CalendarTabProps = {
  services: Service[];
  calendarYear: number;
  calendarMonth: number;
  calendarDays: CalendarDay[];
  calendarLeadingBlanks: number;
  onMonthChange: (year: number, month: number) => void;
  onRefresh: () => Promise<void>;
};

function dateRange(start: string, end: string) {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    dates.push(format(cursor, "yyyy-MM-dd"));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function CalendarTab({
  services,
  calendarYear,
  calendarMonth,
  calendarDays,
  calendarLeadingBlanks,
  onMonthChange,
  onRefresh,
}: CalendarTabProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [clearPrices, setClearPrices] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [useDefaultHours, setUseDefaultHours] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastClickedRef = useRef<string | null>(null);

  const monthLabel = format(new Date(calendarYear, calendarMonth, 1), "MMMM yyyy");
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);
  const selectedDayRows = calendarDays.filter((d) => selectedSet.has(d.date));

  const shiftMonth = (delta: -1 | 1) => {
    const next = new Date(calendarYear, calendarMonth + delta, 1);
    setSelectedDates([]);
    setAvailability(null);
    setPriceDrafts({});
    setClearPrices(false);
    setStartHour(null);
    setDurationHours(null);
    setUseDefaultHours(true);
    lastClickedRef.current = null;
    onMonthChange(next.getFullYear(), next.getMonth());
  };

  const syncPanelFromSelection = useCallback(
    (dates: string[]) => {
      if (dates.length === 0) {
        setAvailability(null);
        setPriceDrafts({});
        setClearPrices(false);
        setStartHour(null);
        setDurationHours(null);
        setUseDefaultHours(true);
        return;
      }

      const rows = calendarDays.filter((d) => dates.includes(d.date));
      const allOpen = rows.every((d) => d.available);
      const allClosed = rows.every((d) => !d.available);
      setAvailability(allOpen ? true : allClosed ? false : null);

      const hourRows = rows.filter((d) => d.hours);
      const allDefault = rows.every((d) => !d.hasCustomHours);

      if (allDefault) {
        setUseDefaultHours(true);
        const sample = rows[0]?.defaultHours ?? rows[0]?.hours;
        if (sample && rows.length === 1) {
          setStartHour(sample.open);
          setDurationHours(hoursDuration(sample));
        } else {
          setStartHour(null);
          setDurationHours(null);
        }
      } else if (
        hourRows.length === rows.length &&
        hourRows.every(
          (d) =>
            d.hours!.open === hourRows[0].hours!.open &&
            d.hours!.close === hourRows[0].hours!.close,
        )
      ) {
        setUseDefaultHours(false);
        setStartHour(hourRows[0].hours!.open);
        setDurationHours(hoursDuration(hourRows[0].hours!));
      } else {
        setUseDefaultHours(false);
        setStartHour(null);
        setDurationHours(null);
      }

      const drafts: Record<string, string> = {};
      for (const svc of services) {
        const values = rows
          .map((d) => d.customPrices?.[svc.id])
          .filter((v): v is number => v !== undefined);
        if (values.length === rows.length && new Set(values).size === 1) {
          drafts[svc.id] = String(values[0] / 100);
        }
      }
      setPriceDrafts(drafts);
      setClearPrices(false);
    },
    [calendarDays, services],
  );

  useEffect(() => {
    syncPanelFromSelection(selectedDates);
  }, [selectedDates, syncPanelFromSelection]);

  const toggleDate = (date: string, shiftKey: boolean) => {
    if (shiftKey && lastClickedRef.current) {
      const [a, b] = [lastClickedRef.current, date].sort();
      const range = dateRange(a, b).filter((d) =>
        calendarDays.some((day) => day.date === d),
      );
      setSelectedDates((prev) => [...new Set([...prev, ...range])]);
      lastClickedRef.current = date;
      return;
    }

    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
    lastClickedRef.current = date;
  };

  const clearSelection = () => {
    setSelectedDates([]);
    lastClickedRef.current = null;
  };

  const saveChanges = async () => {
    if (selectedDates.length === 0) return;

    const prices: Record<string, number> = {};
    for (const svc of services) {
      const raw = priceDrafts[svc.id]?.trim();
      if (!raw) continue;
      const pounds = parseFloat(raw);
      if (!Number.isFinite(pounds) || pounds <= 0) {
        toast.error(`Enter a valid price for ${svc.name}`);
        return;
      }
      prices[svc.id] = Math.round(pounds * 100);
    }

    if (
      availability === null &&
      Object.keys(prices).length === 0 &&
      !clearPrices &&
      useDefaultHours
    ) {
      toast.error("Set open/closed, working hours, or a custom price first");
      return;
    }

    if (
      availability !== false &&
      !useDefaultHours &&
      (startHour === null || durationHours === null)
    ) {
      toast.error("Choose a start time and how many hours you're available");
      return;
    }

    const needsHours = selectedDayRows.some(
      (d) => d.available || availability === true,
    );
    const missingDefault = selectedDayRows.some(
      (d) => !d.defaultHours && (d.available || availability === true),
    );
    if (
      needsHours &&
      missingDefault &&
      useDefaultHours &&
      availability !== false
    ) {
      toast.error("This day needs custom hours — pick a start time and duration");
      return;
    }

    let hours: { open: number; close: number } | undefined;
    if (availability !== false && !useDefaultHours && startHour !== null && durationHours !== null) {
      hours = { open: startHour, close: startHour + durationHours };
      if (hours.close > 22) {
        toast.error("Working hours can't go past 10pm");
        return;
      }
    }

    const hoursChanged =
      (!useDefaultHours && !!hours) ||
      (useDefaultHours && selectedDayRows.some((d) => d.hasCustomHours));

    if (
      availability === null &&
      Object.keys(prices).length === 0 &&
      !clearPrices &&
      !hoursChanged
    ) {
      toast.error("Set open/closed, working hours, or a custom price first");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/availability/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dates: selectedDates,
          ...(availability !== null ? { available: availability } : {}),
          ...(Object.keys(prices).length > 0 ? { prices } : {}),
          ...(clearPrices ? { clearPrices: true } : {}),
          ...(hours ? { hours } : {}),
          ...(useDefaultHours && selectedDayRows.some((d) => d.hasCustomHours)
            ? { clearHours: true }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not save");
      }
      toast.success(
        selectedDates.length === 1
          ? "Day updated"
          : `${selectedDates.length} days updated`,
      );
      await onRefresh();
      clearSelection();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const previewHours =
    startHour !== null && durationHours !== null
      ? { open: startHour, close: startHour + durationHours }
      : null;

  const defaultHoursHint =
    selectedDayRows.length === 1 && selectedDayRows[0].defaultHours
      ? formatHoursRange(selectedDayRows[0].defaultHours)
      : selectedDayRows.length === 1 && !selectedDayRows[0].defaultHours
        ? "No default — set hours below"
        : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            ‹
          </button>
          <p className="min-w-[10rem] text-center font-oswald text-lg font-semibold">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
        {selectedDates.length > 0 && (
          <button
            type="button"
            onClick={clearSelection}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear selection ({selectedDates.length})
          </button>
        )}
      </div>

      <div className="overflow-auto rounded-2xl border border-border bg-card p-5">
        <div className="grid min-w-[560px] grid-cols-7 gap-1.5">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-xs font-semibold text-muted-foreground"
            >
              {d}
            </div>
          ))}
          {Array.from({ length: calendarLeadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {calendarDays.map((day) => {
            const dayNum = Number(day.date.slice(-2));
            const isSelected = selectedSet.has(day.date);
            return (
              <button
                key={day.date}
                type="button"
                onClick={(e) => toggleDate(day.date, e.shiftKey)}
                className={cn(
                  "relative flex h-14 flex-col items-center justify-center rounded-lg border text-xs transition",
                  isSelected && "border-rayz-gold ring-2 ring-rayz-gold/40",
                  !day.available &&
                    "border-dashed border-muted-foreground/30 bg-muted/30 text-muted-foreground",
                  day.available &&
                    day.pending > 0 &&
                    "border-rayz-gold bg-rayz-gold/10",
                  day.available &&
                    day.pending === 0 &&
                    day.booked > 0 &&
                    "border-border bg-foreground/10",
                  day.available &&
                    day.booked === 0 &&
                    day.pending === 0 &&
                    !isSelected &&
                    "border-border bg-background hover:border-rayz-gold/30",
                )}
                title={
                  day.hours
                    ? `${day.date}: ${formatHoursRange(day.hours)} · ${day.booked} booked, ${day.pending} pending`
                    : `${day.date}: ${day.booked} booked, ${day.pending} pending`
                }
              >
                <span className="font-semibold">{dayNum}</span>
                <div className="mt-0.5 flex items-center gap-1">
                  {(day.booked > 0 || day.pending > 0) && (
                    <span className="text-[10px] text-muted-foreground">
                      {day.booked + day.pending}
                    </span>
                  )}
                  {day.hasCustomHours && day.hours && (
                    <span className="text-[9px] font-semibold text-muted-foreground">
                      {hoursDuration(day.hours)}h
                    </span>
                  )}
                  {day.hasCustomPrices && (
                    <span className="rounded bg-rayz-gold/20 px-1 text-[9px] font-bold text-rayz-gold">
                      £
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>■ open</span>
          <span className="text-rayz-gold">■ pending</span>
          <span>■ booked</span>
          <span>▢ closed</span>
          <span className="text-rayz-gold">£ custom price</span>
          <span>custom hours</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Click days to select. Shift+click to select a range. Then set
          availability, working hours, and optional prices below.
        </p>
      </div>

      {selectedDates.length > 0 && (
        <div className="rounded-2xl border border-rayz-gold/25 bg-card p-5">
          <p className="font-oswald text-base font-semibold">
            {selectedDates.length === 1
              ? format(
                  new Date(`${selectedDates[0]}T12:00:00`),
                  "EEEE d MMMM",
                )
              : `${selectedDates.length} days selected`}
          </p>

          <div className="mt-4">
            <p className="mb-2 text-sm text-muted-foreground">Availability</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setAvailability(true);
                  if (selectedDayRows.some((d) => !d.defaultHours)) {
                    setUseDefaultHours(false);
                    setStartHour((prev) => prev ?? 10);
                    setDurationHours((prev) => prev ?? 8);
                  }
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  availability === true
                    ? "bg-emerald-500/15 text-emerald-700"
                    : "border border-border hover:border-rayz-gold/40",
                )}
              >
                Open for bookings
              </button>
              <button
                type="button"
                onClick={() => setAvailability(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  availability === false
                    ? "bg-muted text-muted-foreground"
                    : "border border-border hover:border-rayz-gold/40",
                )}
              >
                Closed
              </button>
            </div>
            {selectedDayRows.length > 1 &&
              selectedDayRows.some((d) => d.available) &&
              selectedDayRows.some((d) => !d.available) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Selected days have mixed availability — pick Open or Closed to
                  apply to all.
                </p>
              )}
          </div>

          {availability !== false && (
            <div className="mt-5">
              <p className="mb-2 text-sm text-muted-foreground">Working hours</p>
              {defaultHoursHint && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Usual hours: {defaultHoursHint}
                </p>
              )}
              <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useDefaultHours}
                  onChange={(e) => setUseDefaultHours(e.target.checked)}
                  className="rounded border-border"
                  disabled={selectedDayRows.some((d) => !d.defaultHours)}
                />
                Use default hours for this day of the week
              </label>
              {!useDefaultHours && (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        Start time
                      </label>
                      <select
                        value={startHour ?? ""}
                        onChange={(e) =>
                          setStartHour(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                      >
                        <option value="">Pick start</option>
                        {START_HOURS.map((h) => (
                          <option key={h} value={h}>
                            {formatHourLabel(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        Hours available
                      </label>
                      <select
                        value={durationHours ?? ""}
                        onChange={(e) =>
                          setDurationHours(
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                      >
                        <option value="">Pick hours</option>
                        {DURATION_OPTIONS.map((h) => (
                          <option key={h} value={h}>
                            {h} hours
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {previewHours && (
                    <p className="text-sm text-muted-foreground">
                      Customers can book{" "}
                      <span className="font-semibold text-foreground">
                        {formatHoursRange(previewHours)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-5">
            <p className="mb-2 text-sm text-muted-foreground">
              Custom prices (optional — leave blank to keep defaults)
            </p>
            <div className="space-y-2">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Default {formatPrice(svc.priceCents)}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg border border-border px-2.5 py-1.5">
                    <span className="text-sm text-muted-foreground">
                      {CURRENCY_SYMBOL}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={(svc.priceCents / 100).toFixed(0)}
                      value={priceDrafts[svc.id] ?? ""}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({
                          ...prev,
                          [svc.id]: e.target.value,
                        }))
                      }
                      className="w-16 border-none bg-transparent text-sm font-bold outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={clearPrices}
                onChange={(e) => setClearPrices(e.target.checked)}
                className="rounded border-border"
              />
              Remove custom prices (use default pricing)
            </label>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={saveChanges}
            className="mt-5 w-full rounded-xl bg-rayz-gold py-3 text-sm font-bold text-rayz-dark transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
