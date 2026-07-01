"use client";

import { Menu, X } from "lucide-react";
import { RayzLogo } from "@/components/rayz-logo";
import { cn } from "@/lib/utils";

export type AdminTab = "pending" | "upcoming" | "calendar" | "services";

const NAV_ITEMS: { id: AdminTab; label: string; shortLabel: string }[] = [
  { id: "pending", label: "Pending", shortLabel: "Pending" },
  { id: "upcoming", label: "Upcoming", shortLabel: "Upcoming" },
  { id: "calendar", label: "Calendar", shortLabel: "Calendar" },
  { id: "services", label: "Services & Pricing", shortLabel: "Services" },
];

type AdminNavLinksProps = {
  tab: AdminTab;
  pendingCount: number;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  className?: string;
};

function navButtonClass(active: boolean) {
  return cn(
    "flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-colors",
    active
      ? "bg-rayz-gold/15 text-rayz-gold"
      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  );
}

export function AdminNavLinks({
  tab,
  pendingCount,
  onTabChange,
  onLogout,
  className,
}: AdminNavLinksProps) {
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={navButtonClass(tab === item.id)}
          onClick={() => onTabChange(item.id)}
        >
          <span>{item.label}</span>
          {item.id === "pending" && pendingCount > 0 && (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rayz-gold px-1 text-[11px] font-bold text-rayz-dark">
              {pendingCount}
            </span>
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="mt-auto rounded-xl px-3.5 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        Sign out
      </button>
    </nav>
  );
}

type AdminMobileHeaderProps = {
  tab: AdminTab;
  pendingCount: number;
  onOpenMenu: () => void;
};

export function AdminMobileHeader({
  tab,
  pendingCount,
  onOpenMenu,
}: AdminMobileHeaderProps) {
  const current = NAV_ITEMS.find((item) => item.id === tab);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
      <RayzLogo size="sm" />
      <div className="min-w-0 flex-1 text-right">
        <p className="truncate font-oswald text-sm font-semibold">
          {current?.shortLabel ?? "Dashboard"}
        </p>
        {pendingCount > 0 && tab !== "pending" && (
          <p className="text-[11px] text-rayz-gold">
            {pendingCount} pending
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onOpenMenu}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-rayz-gold/40"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
        {pendingCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rayz-gold px-1 text-[10px] font-bold text-rayz-dark">
            {pendingCount}
          </span>
        )}
      </button>
    </header>
  );
}

type AdminMobileDrawerProps = {
  open: boolean;
  tab: AdminTab;
  pendingCount: number;
  onClose: () => void;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
};

export function AdminMobileDrawer({
  open,
  tab,
  pendingCount,
  onClose,
  onTabChange,
  onLogout,
}: AdminMobileDrawerProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "visible" : "invisible pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/55 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
        aria-label="Close navigation menu"
      />
      <aside
        className={cn(
          "absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-border bg-rayz-panel p-4 shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <div className="mb-5 flex items-center justify-between">
          <RayzLogo size="md" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-rayz-gold/40"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AdminNavLinks
          tab={tab}
          pendingCount={pendingCount}
          onTabChange={onTabChange}
          onLogout={onLogout}
          className="min-h-0 flex-1"
        />
      </aside>
    </div>
  );
}
