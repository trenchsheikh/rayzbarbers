"use client";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GoldButton } from "@/components/ui/gold-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Service } from "@/lib/db/schema";
import { formatPrice } from "@/lib/shop";
import { cn } from "@/lib/utils";
import { getDayOptions } from "@/lib/shop";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const STEP_TITLES = [
  "Select a Service",
  "Date & Time",
  "Payment",
  "Your Details",
  "Booking Request",
];

type Slot = { label: string; value: string };

type BookingModalProps = {
  open: boolean;
  services: Service[];
  initialServiceId?: string | null;
  onClose: () => void;
};

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-1.5 px-4 py-2">
      {STEP_TITLES.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 rounded-full bg-border transition-all",
            i === step ? "w-[18px] bg-rayz-gold" : "w-1.5",
            i < step && "bg-rayz-gold",
          )}
        />
      ))}
    </div>
  );
}

function PaymentConfirmForm({
  clientSecret,
  onSuccess,
}: {
  clientSecret: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Payment failed");
      return;
    }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      <GoldButton
        className="w-full py-3 text-sm"
        disabled={loading || !stripe}
        onClick={confirm}
      >
        {loading ? "Authorizing…" : "Authorize card"}
      </GoldButton>
      <p className="text-center text-xs text-muted-foreground">
        Charged only once Ray approves your booking.
      </p>
    </div>
  );
}

export function BookingModal({
  open,
  services,
  initialServiceId,
  onClose,
}: BookingModalProps) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash" | null>(
    null,
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dayPriceCents, setDayPriceCents] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const dayOptions = useMemo(() => getDayOptions(), []);
  const selectedService = services.find((s) => s.id === serviceId);

  const reset = useCallback(() => {
    setStep(0);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setPaymentMethod(null);
    setName("");
    setPhone("");
    setEmail("");
    setSlots([]);
    setDayPriceCents(null);
    setSubmitting(false);
    setSubmitted(false);
    setClientSecret(null);
  }, []);

  useEffect(() => {
    if (open) {
      reset();
      if (initialServiceId) {
        setServiceId(initialServiceId);
        setStep(1);
      }
    }
  }, [open, initialServiceId, reset]);

  useEffect(() => {
    if (!date || !serviceId) return;
    fetch(`/api/availability?date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setDayPriceCents(
          typeof data.priceCents === "number" ? data.priceCents : null,
        );
      })
      .catch(() => {
        setSlots([]);
        setDayPriceCents(null);
      });
  }, [date, serviceId]);

  const effectivePriceCents =
    dayPriceCents ?? selectedService?.priceCents ?? null;

  const reviewSummary = selectedService
    ? `${selectedService.name} · ${date ? dayOptions.find((d) => d.date === date)?.label : "no date"} · ${
        time ? format(new Date(time), "h:mm a") : "no time"
      } · ${effectivePriceCents != null ? formatPrice(effectivePriceCents) : "—"} · ${paymentMethod === "online" ? "Pay Online" : paymentMethod === "cash" ? "Pay Cash" : "—"}`
    : "";

  const close = () => {
    onClose();
    setTimeout(reset, 400);
  };

  const selectService = (id: string) => {
    setServiceId(id);
    setTimeout(() => setStep(1), 250);
  };

  const selectPayment = (method: "online" | "cash") => {
    setPaymentMethod(method);
    setTimeout(() => setStep(3), 250);
  };

  const submitBooking = async () => {
    if (!serviceId || !time || !paymentMethod || !name.trim() || !phone.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          startsAt: time,
          paymentMethod,
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerEmail: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");

      if (paymentMethod === "online" && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setStep(4);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setStep(4);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const afterPayment = () => {
    setSubmitted(true);
    setClientSecret(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close booking"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-rayz-gold/15 bg-background shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 pt-5">
          {step > 0 && !submitted && !clientSecret ? (
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-rayz-panel text-lg text-foreground"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              aria-label="Back"
            >
              ‹
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
          <p className="font-oswald text-sm font-bold tracking-wide">
            {submitted ? "" : STEP_TITLES[step]}
          </p>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-rayz-panel text-foreground"
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!submitted && !clientSecret && <StepDots step={step} />}

        <div className="rayz-scrollbar min-h-0 flex-1 overflow-y-auto px-6 pb-6 pr-5">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a service to get started
              </p>
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => selectService(svc.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition",
                    serviceId === svc.id
                      ? "border-rayz-gold bg-rayz-gold/10"
                      : "border-border bg-rayz-panel/80",
                  )}
                >
                  <div>
                    <p className="font-oswald font-semibold">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {svc.durationMinutes} min
                    </p>
                  </div>
                  <span className="font-bold text-rayz-gold">
                    {formatPrice(svc.priceCents)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Pick a day</p>
                <div className="rayz-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {dayOptions.map((day) => (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setDate(day.date);
                        setTime(null);
                      }}
                      className={cn(
                        "shrink-0 rounded-xl border px-3.5 py-2.5 text-sm font-semibold",
                        date === day.date
                          ? "border-rayz-gold bg-rayz-gold text-rayz-dark"
                          : "border-border bg-rayz-panel/80",
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Pick a time</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => setTime(slot.value)}
                      className={cn(
                        "rounded-lg border py-2.5 text-xs font-semibold",
                        time === slot.value
                          ? "border-rayz-gold bg-rayz-gold text-rayz-dark"
                          : "border-border bg-rayz-panel/80",
                      )}
                    >
                      {slot.label}
                    </button>
                  ))}
                  {date && slots.length === 0 && (
                    <p className="col-span-3 text-sm text-muted-foreground">
                      No open slots this day.
                    </p>
                  )}
                </div>
              </div>
              <GoldButton
                className="w-full py-3 text-sm"
                disabled={!date || !time}
                onClick={() => setStep(2)}
              >
                Continue
                {effectivePriceCents != null && (
                  <span className="ml-2 opacity-80">
                    · {formatPrice(effectivePriceCents)}
                  </span>
                )}
              </GoldButton>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                How would you like to pay?
              </p>
              <button
                type="button"
                onClick={() => selectPayment("online")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left",
                  paymentMethod === "online"
                    ? "border-rayz-gold bg-rayz-gold/10"
                    : "border-border bg-rayz-panel/80",
                )}
              >
                <span className="text-xl">💳</span>
                <div>
                  <p className="font-bold">Pay Online</p>
                  <p className="text-xs text-muted-foreground">
                    Charged only once Ray approves
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => selectPayment("cash")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left",
                  paymentMethod === "cash"
                    ? "border-rayz-gold bg-rayz-gold/10"
                    : "border-border bg-rayz-panel/80",
                )}
              >
                <span className="text-xl">💵</span>
                <div>
                  <p className="font-bold">Pay Cash</p>
                  <p className="text-xs text-muted-foreground">
                    Pay in person after your cut
                  </p>
                </div>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Your details</p>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                />
              </div>
              <div className="rounded-xl bg-rayz-panel/60 p-3.5 text-sm leading-relaxed text-muted-foreground">
                {reviewSummary}
              </div>
              <GoldButton
                className="w-full py-3.5 text-sm"
                disabled={!name.trim() || !phone.trim() || submitting}
                onClick={submitBooking}
              >
                {submitting ? "Sending…" : "Send Request"}
              </GoldButton>
            </div>
          )}

          {step === 4 && clientSecret && stripePromise && !submitted && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentConfirmForm
                clientSecret={clientSecret}
                onSuccess={afterPayment}
              />
            </Elements>
          )}

          {step === 4 && submitted && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-rayz-gold text-rayz-gold">
                <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden>
                  <path
                    d="M18 33l9 9 19-19"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-xl font-bold">Request Sent!</p>
              <span className="rounded-full bg-rayz-panel px-4 py-1.5 text-xs font-semibold text-muted-foreground">
                Pending Approval
              </span>
              <p className="max-w-[220px] text-sm leading-relaxed text-muted-foreground">
                You&apos;ll get a notification the moment Ray approves your
                slot.
              </p>
              <GoldButton className="mt-2 px-8 py-3 text-sm" onClick={close}>
                Done
              </GoldButton>
            </div>
          )}

          {step === 4 && submitting && (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-t-rayz-gold" />
              <p className="text-sm text-muted-foreground">
                Sending your request…
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
