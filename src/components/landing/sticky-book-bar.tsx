"use client";

import { useEffect, useState } from "react";
import { GoldButton } from "@/components/ui/gold-button";
import { RayzLogo } from "@/components/rayz-logo";
import { cn } from "@/lib/utils";

export function StickyBookBar({ onBook }: { onBook: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.65);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl transition duration-300",
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <RayzLogo size="md" />
        <GoldButton className="px-6 py-2.5 text-sm" onClick={onBook}>
          Book Now
        </GoldButton>
      </div>
    </div>
  );
}
