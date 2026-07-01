"use client";

import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GoogleReviewsData } from "@/lib/google-reviews";
import { cn } from "@/lib/utils";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating)
              ? "fill-rayz-gold text-rayz-gold"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  author,
  rating,
  text,
  relativeTime,
}: {
  author: string;
  rating: number;
  text: string;
  relativeTime: string;
}) {
  const initials = author
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="flex h-full w-[min(100%,320px)] shrink-0 snap-start flex-col rounded-2xl border border-border/80 bg-background p-6 shadow-sm">
      <StarRating rating={rating} />
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground/90">
        &ldquo;{text}&rdquo;
      </blockquote>
      <footer className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rayz-panel text-xs font-bold text-rayz-gold">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{author}</p>
          <p className="text-xs text-muted-foreground">{relativeTime}</p>
        </div>
      </footer>
    </article>
  );
}

export function TestimonialsSection({ data }: { data: GoogleReviewsData }) {
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
  }, [data.reviews, updateScrollState]);

  const scroll = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({
      left: direction * 340,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-rayz-panel/60 py-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rayz-gold">
              Google Reviews
            </p>
            <h2 className="mt-2 font-anton text-3xl tracking-wide">
              WHAT CLIENTS SAY
            </h2>
          </div>

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <div className="flex items-center gap-2">
              <span className="font-oswald text-3xl font-semibold leading-none">
                {data.rating.toFixed(1)}
              </span>
              <StarRating rating={data.rating} />
            </div>
            <a
              href={data.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground transition hover:text-rayz-gold"
            >
              {data.totalCount} reviews on Google ↗
            </a>
          </div>
        </div>

        <div className="relative">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll(-1)}
              aria-label="Previous reviews"
              className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition hover:border-rayz-gold/40 hover:text-rayz-gold md:-left-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll(1)}
              aria-label="Next reviews"
              className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md transition hover:border-rayz-gold/40 hover:text-rayz-gold md:-right-4"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            ref={trackRef}
            className={cn(
              "rayz-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2",
              "[-ms-overflow-style:none] [scrollbar-width:thin]",
            )}
          >
            {data.reviews.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
