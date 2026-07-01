import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "rayz_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AdminUser = {
  username: string;
};

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "rayz-dev-session-secret-change-me";
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? "ray",
    password: process.env.ADMIN_PASSWORD ?? "pass",
  };
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacSign(message: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyAdminPassword(username: string, password: string) {
  const creds = getAdminCredentials();
  return (
    timingSafeEqual(username.trim(), creds.username) &&
    timingSafeEqual(password, creds.password)
  );
}

export async function createSessionToken(username: string) {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${username}:${exp}`;
  const sig = await hmacSign(payload, getSecret());
  return `${toBase64Url(encoder.encode(payload))}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<AdminUser | null> {
  if (!token) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const payload = fromBase64Url(payloadB64);
  const expected = await hmacSign(payload, getSecret());
  if (!timingSafeEqual(sig, expected)) return null;

  const colon = payload.indexOf(":");
  if (colon === -1) return null;

  const username = payload.slice(0, colon);
  const exp = Number(payload.slice(colon + 1));
  if (!username || Number.isNaN(exp) || Date.now() > exp) return null;

  return { username };
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
