import { z } from "zod";

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime(),
  paymentMethod: z.enum(["online", "cash"]),
  customerName: z.string().min(1).max(120),
  customerPhone: z.string().min(7).max(30),
  customerEmail: z.string().email().optional().or(z.literal("")),
  stripePaymentIntentId: z.string().optional(),
});

export const updateServicePriceSchema = z.object({
  id: z.string().uuid(),
  priceCents: z.number().int().positive(),
});
