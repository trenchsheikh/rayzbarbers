import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

export function requireStripe() {
  const client = getStripe();
  if (!client) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return client;
}

export async function createManualCaptureIntent(amountCents: number, metadata: Record<string, string>) {
  const stripe = requireStripe();
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "gbp",
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}

export async function capturePaymentIntent(paymentIntentId: string) {
  const stripe = requireStripe();
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  const stripe = requireStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}
