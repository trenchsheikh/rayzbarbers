import { Resend } from "resend";
import { format } from "date-fns";
import type { Booking, Service } from "./db/schema";
import { SHOP_INFO } from "./shop";

let resend: Resend | null = null;

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const fromEmail = process.env.RESEND_FROM_EMAIL ?? "bookings@rayzbarbers.com";

async function sendEmail(to: string, subject: string, html: string) {
  const client = getResend();
  if (!client || !to) {
    console.log(`[email stub] To: ${to} | ${subject}`);
    return;
  }
  await client.emails.send({ from: fromEmail, to, subject, html });
}

function bookingDetails(booking: Booking, service: Service) {
  return `
    <p><strong>Service:</strong> ${service.name}</p>
    <p><strong>When:</strong> ${format(booking.startsAt, "EEE, MMM d 'at' h:mm a")}</p>
    <p><strong>Payment:</strong> ${booking.paymentMethod === "online" ? "Pay online (charged on approval)" : "Pay cash in shop"}</p>
  `;
}

export async function sendBookingReceived(
  booking: Booking,
  service: Service,
) {
  if (!booking.customerEmail) return;
  await sendEmail(
    booking.customerEmail,
    "Booking request received — Rayz Barbers",
    `<p>Hi ${booking.customerName},</p>
     <p>Your booking request is with Ray for review.</p>
     ${bookingDetails(booking, service)}
     <p>You'll hear back once it's approved.</p>
     <p>— ${SHOP_INFO.name}</p>`,
  );
}

export async function sendBookingApproved(
  booking: Booking,
  service: Service,
) {
  if (!booking.customerEmail) return;
  await sendEmail(
    booking.customerEmail,
    "You're booked — Rayz Barbers",
    `<p>Hi ${booking.customerName},</p>
     <p>Ray approved your appointment.</p>
     ${bookingDetails(booking, service)}
     <p>See you soon at ${SHOP_INFO.address}.</p>
     <p>— ${SHOP_INFO.name}</p>`,
  );
}

export async function sendBookingDeclined(
  booking: Booking,
  service: Service,
) {
  if (!booking.customerEmail) return;
  await sendEmail(
    booking.customerEmail,
    "Booking update — Rayz Barbers",
    `<p>Hi ${booking.customerName},</p>
     <p>Unfortunately Ray couldn't confirm this slot:</p>
     ${bookingDetails(booking, service)}
     <p>Please pick another time on our site.</p>
     <p>— ${SHOP_INFO.name}</p>`,
  );
}
