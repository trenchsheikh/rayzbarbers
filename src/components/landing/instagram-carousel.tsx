"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { INSTAGRAM_REELS } from "@/lib/instagram-embed";
import { cn } from "@/lib/utils";

const CARD_WIDTH = 168;

export function InstagramCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * (CARD_WIDTH + 12) * 2,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous reels"
          className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition hover:border-rayz-gold/40 hover:text-rayz-gold md:-left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next reels"
          className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition hover:border-rayz-gold/40 hover:text-rayz-gold md:-right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div
        ref={trackRef}
        className={cn(
          "rayz-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2",
          "scroll-px-1 [-ms-overflow-style:none] [scrollbar-width:thin]",
        )}
      >
        {INSTAGRAM_REELS.map((reel) => (
          <a
            key={reel.id}
            href={reel.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[9/16] w-[168px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-rayz-slot shadow-sm transition hover:border-rayz-gold/50 hover:shadow-md"
            title="Watch on Instagram"
          >
            <Image
              src={reel.thumbnail}
              alt="Rayz Barbers reel on Instagram"
              fill
              sizes="168px"
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
              <Play className="h-3 w-3 fill-white" />
              Reel
            </span>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-8 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              Watch on Instagram
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
