import { NextResponse } from "next/server";
import { requireStripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripe = requireStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing webhook config" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.payment_failed") {
    console.log("Payment failed:", event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
