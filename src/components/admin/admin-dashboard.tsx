"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RayzLogo } from "@/components/rayz-logo";
import type { Booking, Service } from "@/lib/db/schema";
import { formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";

type Tab = "pending" | "upcoming" | "calendar" | "services";

type BookingRow = Booking & { serviceName?: string };

const TAB_COPY: Record<Tab, { heading: string; sub: string }> = {
  pending: {
    heading: "Pending Requests",
    sub: "New requests waiting on your approval",
  },
  upcoming: {
    heading: "Upcoming Bookings",
    sub: "Confirmed appointments on the books",
  },
  calendar: {
    heading: "Calendar",
    sub: "A quick look at the week ahead",
  },
  services: {
    heading: "Services & Pricing",
    sub: "Tap the pencil to update a price",
  },
};

function paymentLabel(method: string) {
  return method === "online" ? "Paid online" : "Pays cash";
}

export function AdminDashboard({ initialServices }: { initialServices: Service[] }) {
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<BookingRow[]>([]);
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [services, setServices] = useState(initialServices);
  const [calendarDays, setCalendarDays] = useState<
    { date: string; booked: number; pending: number }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");

  const enrich = useCallback(
    (rows: Booking[]): BookingRow[] =>
      rows.map((b) => ({
        ...b,
        serviceName: services.find((s) => s.id === b.serviceId)?.name ?? "Service",
      })),
    [services],
  );

  const loadBookings = useCallback(async () => {
    const [pRes, uRes] = await Promise.all([
      fetch("/api/bookings?status=pending"),
      fetch("/api/bookings?status=confirmed"),
    ]);
    if (pRes.ok) {
      const data = await pRes.json();
      setPending(enrich(data.bookings ?? []));
    }
    if (uRes.ok) {
      const data = await uRes.json();
      setUpcoming(enrich(data.bookings ?? []));
    }
  }, [enrich]);

  const loadCalendar = useCallback(async () => {
    const now = new Date();
    const res = await fetch(
      `/api/calendar?year=${now.getFullYear()}&month=${now.getMonth()}`,
    );
    if (res.ok) {
      const data = await res.json();
      setCalendarDays(data.days ?? []);
    }
  }, []);

  useEffect(() => {
    loadBookings();
    loadCalendar();
    const id = setInterval(loadBookings, 15000);
    return () => clearInterval(id);
  }, [loadBookings, loadCalendar]);

  const approve = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}/approve`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Approve failed");
      return;
    }
    toast.success("Approved — customer notified");
    loadBookings();
    loadCalendar();
  };

  const decline = async (id: string) => {
    const res = await fetch(`/api/bookings/${id}/decline`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Decline failed");
      return;
    }
    toast.success("Declined — customer notified");
    loadBookings();
    loadCalendar();
  };

  const savePrice = async (id: string) => {
    const cents = Math.round(parseFloat(priceDraft) * 100);
    if (!cents || cents <= 0) {
      setEditingId(null);
      return;
    }
    const res = await fetch("/api/services/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, priceCents: cents }),
    });
    if (res.ok) {
      const data = await res.json();
      setServices((prev) =>
        prev.map((s) => (s.id === id ? data.service : s)),
      );
      toast.success("Price updated");
    }
    setEditingId(null);
  };

  const navBtn = (active: boolean) =>
    cn(
      "mb-0.5 flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold",
      active
        ? "bg-rayz-gold/15 text-rayz-gold"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-rayz-panel p-4 pt-8">
        <RayzLogo size="md" className="mb-6" />
        <button
          type="button"
          className={navBtn(tab === "pending")}
          onClick={() => setTab("pending")}
        >
          <span>Pending</span>
          {pending.length > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rayz-gold px-1 text-[11px] font-bold text-rayz-dark">
              {pending.length}
            </span>
          )}
        </button>
        <button
          type="button"
          className={navBtn(tab === "upcoming")}
          onClick={() => setTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          type="button"
          className={navBtn(tab === "calendar")}
          onClick={() => setTab("calendar")}
        >
          Calendar
        </button>
        <button
          type="button"
          className={navBtn(tab === "services")}
          onClick={() => setTab("services")}
        >
          Services &amp; Pricing
        </button>
      </aside>

      <main className="max-w-3xl flex-1 overflow-visible p-8 md:p-10">
        <h1 className="font-anton text-3xl tracking-wide">
          {TAB_COPY[tab].heading}
        </h1>
        <p className="mt-1 mb-8 text-sm text-muted-foreground">
          {TAB_COPY[tab].sub}
        </p>

        {tab === "pending" && (
          <div className="space-y-3">
            {pending.length === 0 && (
              <p className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                All caught up — no pending requests.
              </p>
            )}
            {pending.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="font-oswald font-semibold">{req.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {req.serviceName} ·{" "}
                    {format(req.startsAt, "EEE MMM d, h:mm a")}
                  </p>
                  <span
                    className={cn(
                      "mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      req.paymentMethod === "online"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {paymentLabel(req.paymentMethod)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => approve(req.id)}
                    className="rounded-full bg-rayz-gold px-4 py-2 text-sm font-bold text-rayz-dark"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decline(req.id)}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "upcoming" && (
          <div className="space-y-3">
            {upcoming.map((bk) => (
              <div
                key={bk.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="font-oswald font-semibold">{bk.customerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {bk.serviceName} ·{" "}
                    {format(bk.startsAt, "EEE MMM d, h:mm a")}
                  </p>
                  <span className="mt-1.5 inline-block rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    {paymentLabel(bk.paymentMethod)}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-400">
                  Confirmed
                </span>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No confirmed bookings yet.
              </p>
            )}
          </div>
        )}

        {tab === "calendar" && (
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
              {calendarDays.map((day) => (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => day.pending > 0 && setTab("pending")}
                  className={cn(
                    "h-5 rounded",
                    day.booked > 0 && "bg-foreground/30",
                    day.pending > 0 &&
                      "border-2 border-rayz-gold bg-transparent",
                    day.booked === 0 &&
                      day.pending === 0 &&
                      "bg-muted/40",
                  )}
                  title={`${day.date}: ${day.booked} booked, ${day.pending} pending`}
                />
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <span>■ booked</span>
              <span className="text-rayz-gold">■ pending — click to review</span>
              <span>□ open</span>
            </div>
          </div>
        )}

        {tab === "services" && (
          <div className="space-y-3">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4"
              >
                <div>
                  <p className="font-oswald font-semibold">{svc.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {svc.durationMinutes} min
                  </p>
                </div>
                {editingId === svc.id ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 rounded-lg border-2 border-rayz-gold px-2.5 py-1.5">
                      <span className="text-sm text-muted-foreground">$</span>
                      <input
                        className="w-14 border-none bg-transparent text-sm font-bold outline-none"
                        value={priceDraft}
                        onChange={(e) => setPriceDraft(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && savePrice(svc.id)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rayz-gold font-bold text-rayz-dark"
                      onClick={() => savePrice(svc.id)}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border"
                      onClick={() => setEditingId(null)}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-rayz-gold">
                      {formatPrice(svc.priceCents)}
                    </span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground"
                      onClick={() => {
                        setEditingId(svc.id);
                        setPriceDraft(String(svc.priceCents / 100));
                      }}
                    >
                      ✎
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
