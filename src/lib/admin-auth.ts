import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { redirect } from "next/navigation";

import { requiredEnv } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "anti_phishing_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

type AdminSessionPayload = {
  email: string;
  expiresAt: number;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", requiredEnv("ADMIN_SESSION_SECRET")).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const expectedEmail = requiredEnv("ADMIN_EMAIL").toLowerCase();
  const expectedPassword = requiredEnv("ADMIN_PASSWORD");

  return constantTimeEqual(email.toLowerCase(), expectedEmail) && constantTimeEqual(password, expectedPassword);
}

export function createAdminSessionToken(email: string, now = Date.now()): string {
  const payload: AdminSessionPayload = {
    email,
    expiresAt: now + SESSION_DURATION_SECONDS * 1000
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAdminSessionToken(token: string | undefined): AdminSessionPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !constantTimeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;

    if (!payload.email || Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();

  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production"
  };
}
