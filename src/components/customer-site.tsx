"use client";

import { useState } from "react";
import type { GoogleReviewsData } from "@/lib/google-reviews";
import type { Service } from "@/lib/db/schema";
import { AboutSection } from "@/components/landing/about-section";
import { BookingModal } from "@/components/booking/booking-modal";
import { FindUsSection } from "@/components/landing/find-us-section";
import { GallerySection } from "@/components/landing/gallery-section";
import { Hero } from "@/components/landing/hero";
import { ServicesSection } from "@/components/landing/services-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { StickyBookBar } from "@/components/landing/sticky-book-bar";
import { TestimonialsSection } from "@/components/landing/testimonials-section";

export function CustomerSite({
  services,
  reviews,
}: {
  services: Service[];
  reviews: GoogleReviewsData;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [initialServiceId, setInitialServiceId] = useState<string | null>(null);

  const openBooking = (serviceId?: string) => {
    setInitialServiceId(serviceId ?? null);
    setBookingOpen(true);
  };

  return (
    <>
      <Hero
        onBook={() => openBooking()}
        googleRating={reviews.rating}
        googleReviewCount={reviews.totalCount}
        googleMapsUrl={reviews.mapsUrl}
      />
      <GallerySection />
      <ServicesSection services={services} onBook={(id) => openBooking(id)} />
      <AboutSection />
      <TestimonialsSection data={reviews} />
      <FindUsSection />
      <SiteFooter />
      <StickyBookBar onBook={() => openBooking()} />

      <BookingModal
        open={bookingOpen}
        services={services}
        initialServiceId={initialServiceId}
        onClose={() => setBookingOpen(false)}
      />
    </>
  );
}
