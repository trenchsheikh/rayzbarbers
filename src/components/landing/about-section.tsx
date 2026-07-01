import {
  Award,
  CalendarCheck,
  MapPin,
  Scissors,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SHOP_INFO } from "@/lib/shop";

const TRUST_PILLARS = [
  {
    icon: Award,
    title: "12+ years in the chair",
    description:
      "Same barber, same standard — honed craft you can count on every visit.",
  },
  {
    icon: Scissors,
    title: "Skin fade specialist",
    description:
      "Sharp fades and clean scissor work. No rushed lines, no shortcuts.",
  },
  {
    icon: UserRound,
    title: "One barber, one focus",
    description:
      "Ray runs the shop. You get his full attention — not a rotating cast.",
  },
  {
    icon: CalendarCheck,
    title: "Appointments only",
    description:
      "Booked slots mean no long waits and a calm, professional environment.",
  },
  {
    icon: MapPin,
    title: "Kings Cross, London",
    description:
      "186 York Wy, N7 9AT — easy to reach, ~6 minutes from Kings Cross station.",
  },
  {
    icon: ShieldCheck,
    title: "Every booking reviewed",
    description:
      "Online requests are personally approved so your slot is locked in properly.",
  },
] as const;

function TrustCard({
  icon: Icon,
  title,
  description,
}: {
  icon: (typeof TRUST_PILLARS)[number]["icon"];
  title: string;
  description: string;
}) {
  return (
    <article className="flex gap-4 rounded-2xl border border-border/80 bg-background p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rayz-gold/15 text-rayz-gold">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <h3 className="font-oswald text-base font-semibold tracking-wide">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

export function AboutSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rayz-gold">
          Why Rayz
        </p>
        <h2 className="mt-2 font-anton text-3xl tracking-wide md:text-4xl">
          ABOUT THE SHOP
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground md:text-base">
          {SHOP_INFO.about}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_PILLARS.map((pillar) => (
          <TrustCard key={pillar.title} {...pillar} />
        ))}
      </div>
    </section>
  );
}
