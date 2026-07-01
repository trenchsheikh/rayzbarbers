import type { Service } from "@/lib/db/schema";
import { formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { Scissors } from "lucide-react";

function ServiceIcon({ slug }: { slug: string }) {
  if (slug === "skin-fade") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 7h16M6.5 12h11M9.5 17h5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (slug === "beard-trim") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 15.2L15 4.7l3.3 3.3-10.5 10.5H4.5v-3.3z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return <Scissors className="h-5 w-5" aria-hidden />;
}

export function ServicesSection({
  services,
  onBook,
}: {
  services: Service[];
  onBook: (serviceId: string) => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <h2 className="text-center font-anton text-4xl tracking-wide md:text-5xl">
        SERVICES
      </h2>
      <p className="mt-2 text-center text-muted-foreground">
        Pick one — or ask Ray for a combo in person
      </p>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((svc) => (
          <article
            key={svc.id}
            className="flex flex-col gap-3.5 rounded-2xl border border-border bg-card p-7"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rayz-gold/15 text-rayz-gold">
              <ServiceIcon slug={svc.slug} />
            </div>
            <h3 className="font-oswald text-xl font-semibold tracking-wide">
              {svc.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {svc.durationMinutes} min
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <span className="text-2xl font-extrabold text-rayz-gold">
                {formatPrice(svc.priceCents)}
              </span>
              <button
                type="button"
                onClick={() => onBook(svc.id)}
                className={cn(
                  "rounded-full border border-border px-5 py-2 text-sm font-semibold text-muted-foreground transition hover:border-rayz-gold hover:text-foreground",
                )}
              >
                Book
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
