import { SHOP_INFO } from "@/lib/shop";

const HOURS = [
  { days: "Mon – Fri", hours: "10am – 8pm" },
  { days: "Saturday", hours: "9am – 6pm" },
  { days: "Sunday", hours: "Closed", muted: true },
];

const mapEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(SHOP_INFO.mapsQuery)}&z=16&hl=en&output=embed`;

export function FindUsSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <div className="grid items-start gap-12 rounded-3xl bg-rayz-panel p-10 md:grid-cols-2">
        <div>
          <h2 className="font-anton text-3xl tracking-wide">FIND US</h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            {SHOP_INFO.address}
            <br />
            {SHOP_INFO.city}
          </p>
          <a
            href={SHOP_INFO.mapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-rayz-gold hover:underline"
          >
            Get directions ↗
          </a>
          <div className="mt-6 flex flex-col gap-2">
            {HOURS.map((row) => (
              <div
                key={row.days}
                className={`flex justify-between border-b border-border pb-2 text-sm ${
                  row.muted ? "text-muted-foreground/70" : "text-muted-foreground"
                }`}
              >
                <span>{row.days}</span>
                <span>{row.hours}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-rayz-slot shadow-sm">
          <iframe
            title="Rayz Barbers on Google Maps"
            src={mapEmbedSrc}
            className="h-64 w-full border-0 md:h-[280px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
