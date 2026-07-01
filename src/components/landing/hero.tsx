"use client";

import { GoogleReviewsBadge } from "@/components/landing/google-reviews-badge";
import { GoldButton } from "@/components/ui/gold-button";
import { RayzLogo } from "@/components/rayz-logo";
import { SHOP_INFO } from "@/lib/shop";

export function Hero({
  onBook,
  googleRating,
  googleReviewCount,
  googleMapsUrl,
}: {
  onBook: () => void;
  googleRating: number;
  googleReviewCount: number;
  googleMapsUrl: string;
}) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_15%,rgba(201,154,60,0.22),transparent_65%)]" />
      <RayzLogo size="hero" priority className="mx-auto" />
      <p className="mt-5 max-w-md text-lg text-muted-foreground">
        {SHOP_INFO.tagline}
      </p>
      <GoogleReviewsBadge
        rating={googleRating}
        totalCount={googleReviewCount}
        mapsUrl={googleMapsUrl}
        className="mt-6"
      />
      <GoldButton className="mt-9" onClick={onBook}>
        Book Now
      </GoldButton>
      <p className="mt-4 text-xs text-muted-foreground/80">
        No account needed · Every booking reviewed by Ray
      </p>
      <div className="absolute bottom-7 animate-bounce text-2xl text-muted-foreground/60">
        ⌄
      </div>
    </section>
  );
}
