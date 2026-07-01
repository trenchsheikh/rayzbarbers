import { SHOP_INFO } from "@/lib/shop";
import { InstagramCarousel } from "@/components/landing/instagram-carousel";

export function GallerySection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-anton text-3xl tracking-wide">FRESH CUTS</h2>
        <a
          href={SHOP_INFO.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-rayz-gold hover:underline"
        >
          @rayzbarbers ↗
        </a>
      </div>
      <InstagramCarousel />
    </section>
  );
}
