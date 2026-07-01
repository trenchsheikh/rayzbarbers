import { addDays, format } from "date-fns";

export function getDayOptions(count = 6, from = new Date()) {
  const options: { label: string; date: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(from, i);
    options.push({ label: format(d, "EEE d"), date: format(d, "yyyy-MM-dd") });
  }
  return options;
}

export const SHOP_HOURS = {
  0: null,
  1: { open: 10, close: 20 },
  2: { open: 10, close: 20 },
  3: { open: 10, close: 20 },
  4: { open: 10, close: 20 },
  5: { open: 10, close: 20 },
  6: { open: 9, close: 18 },
} as const;

export const SHOP_INFO = {
  name: "Rayz Barbers",
  tagline: "Sharp fades and straight razor lines. Booked in under a minute.",
  address: "186 York Wy",
  city: "London N7 9AT",
  mapsQuery: "186 York Wy, London N7 9AT",
  mapsDirectionsUrl:
    "https://www.google.com/maps/dir/?api=1&destination=186+York+Wy,+London+N7+9AT",
  phone: "+12125550134",
  instagram: "https://instagram.com/rayzbarbers",
  snapchat: "https://www.snapchat.com/add/rayzbarbers",
  whatsapp: "https://wa.me/12125550134",
  about:
    "Ray's been cutting hair in the same chair for twelve years. One barber, one standard — no rushed lines, no small talk you didn't ask for. Walk in for a trim, walk out looking like you meant to.",
};

export const DEFAULT_SERVICES = [
  {
    slug: "skin-fade",
    name: "Skin Fade",
    durationMinutes: 45,
    priceCents: 3500,
  },
  {
    slug: "beard-trim",
    name: "Beard Trim",
    durationMinutes: 20,
    priceCents: 1800,
  },
  {
    slug: "cut-beard",
    name: "Cut & Beard",
    durationMinutes: 60,
    priceCents: 4800,
  },
] as const;

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
