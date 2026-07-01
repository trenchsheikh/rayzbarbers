"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AdminMobileDrawer,
  AdminMobileHeader,
  AdminNavLinks,
  type AdminTab,
} from "@/components/admin/admin-nav";
import { RayzLogo } from "@/components/rayz-logo";
import { CalendarTab } from "@/components/admin/calendar-tab";
import { UpcomingBookingsCalendar } from "@/components/admin/upcoming-bookings-calendar";
import type { Booking, Service } from "@/lib/db/schema";
import { formatPrice, CURRENCY_SYMBOL } from "@/lib/shop";
import type { CalendarDay } from "@/lib/availability";
import { cn } from "@/lib/utils";

type Tab = AdminTab;

type BookingRow = Booking & { serviceName?: string };

const TAB_COPY: Record<Tab, { heading: string; sub: string }> = {
  pending: {
    heading: "Pending Requests",
    sub: "New requests waiting on your approval",
  },
  upcoming: {
    heading: "Upcoming Bookings",
    sub: "Week view of confirmed appointments by day and time",
  },
  calendar: {
    heading: "Calendar",
    sub: "Select days to set availability and custom prices",
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
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<BookingRow[]>([]);
  const [upcoming, setUpcoming] = useState<BookingRow[]>([]);
  const [services, setServices] = useState(initialServices);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [calendarLeadingBlanks, setCalendarLeadingBlanks] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    const res = await fetch(
      `/api/calendar?year=${calendarYear}&month=${calendarMonth}`,
    );
    if (res.ok) {
      const data = await res.json();
      setCalendarDays(data.days ?? []);
      setCalendarLeadingBlanks(data.leadingBlanks ?? 0);
    }
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    loadBookings();
    loadCalendar();
    const id = setInterval(loadBookings, 15000);
    return () => clearInterval(id);
  }, [loadBookings, loadCalendar]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  const selectTab = (next: Tab) => {
    setTab(next);
    setMobileNavOpen(false);
  };

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

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const shiftCalendarMonth = (year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <AdminMobileHeader
        tab={tab}
        pendingCount={pending.length}
        onOpenMenu={() => setMobileNavOpen(true)}
      />

      <AdminMobileDrawer
        open={mobileNavOpen}
        tab={tab}
        pendingCount={pending.length}
        onClose={() => setMobileNavOpen(false)}
        onTabChange={selectTab}
        onLogout={logout}
      />

      <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r border-border bg-rayz-panel p-4 pt-8 lg:flex">
        <RayzLogo size="md" className="mb-6" />
        <AdminNavLinks
          tab={tab}
          pendingCount={pending.length}
          onTabChange={selectTab}
          onLogout={logout}
          className="flex min-h-0 flex-1 flex-col"
        />
      </aside>

      <main
        className={cn(
          "mx-auto w-full flex-1 overflow-visible px-4 py-6 sm:px-6 md:p-10",
          tab === "upcoming" || tab === "calendar" ? "max-w-6xl" : "max-w-3xl",
        )}
      >
        <h1 className="font-anton text-2xl tracking-wide sm:text-3xl">
          {TAB_COPY[tab].heading}
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground sm:mb-8">
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
          <UpcomingBookingsCalendar bookings={upcoming} />
        )}

        {tab === "calendar" && (
          <CalendarTab
            services={services}
            calendarYear={calendarYear}
            calendarMonth={calendarMonth}
            calendarDays={calendarDays}
            calendarLeadingBlanks={calendarLeadingBlanks}
            onMonthChange={shiftCalendarMonth}
            onRefresh={loadCalendar}
          />
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
                      <span className="text-sm text-muted-foreground">{CURRENCY_SYMBOL}</span>
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
