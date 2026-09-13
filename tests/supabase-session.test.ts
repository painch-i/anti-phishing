import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";

const user = { id: "11111111-1111-4111-8111-111111111111", aud: "authenticated", email: "operator@example.com" };

function session(expired = false) {
  const expiresAt = Math.floor(Date.now() / 1000) + (expired ? -60 : 3600);
  const jwt = [
    { alg: "HS256", typ: "JWT" }, { sub: user.id, exp: expiresAt, aud: "authenticated" }
  ].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".") + ".test-signature";
  return { access_token: jwt, refresh_token: "test-refresh-token", expires_at: expiresAt, expires_in: 3600, token_type: "bearer", user };
}

describe("Supabase SSR cookies", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://session-test.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("persists login and refresh cookies on redirects with private cache headers", async () => {
    const fresh = session();
    const fetch = vi.fn()
      .mockResolvedValueOnce(Response.json(session(true)))
      .mockResolvedValueOnce(Response.json(fresh))
      .mockResolvedValueOnce(Response.json(user));
    vi.stubGlobal("fetch", fetch);
    const initial = createSupabaseRouteClient(new NextRequest("https://app.example/api/admin/login"));
    await initial.supabase.auth.signInWithPassword({ email: user.email, password: "test-password" });
    const signedIn = initial.withSession(NextResponse.redirect("https://app.example/admin"));
    const cookieHeader = signedIn.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    expect(cookieHeader).toContain("sb-session-test-auth-token");
    expect(signedIn.headers.get("set-cookie")).toContain("HttpOnly");

    const request = new NextRequest("https://app.example/admin", { headers: { cookie: cookieHeader } });
    const refreshed = createSupabaseRouteClient(request);
    const result = await refreshed.supabase.auth.getUser();
    expect(result.data.user?.id).toBe(user.id);
    expect(fetch.mock.calls[1][0]).toContain("grant_type=refresh_token");
    const response = refreshed.withSession(NextResponse.redirect("https://app.example/admin"));
    expect(response.cookies.getAll().length).toBeGreaterThan(0);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(request.cookies.getAll()).toEqual(response.cookies.getAll().map(({ name, value }) => ({ name, value })));
  });

  it("rejects a cookie whose token Supabase does not verify", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(Response.json(session()))
      .mockResolvedValueOnce(Response.json({ message: "Invalid JWT" }, { status: 401 }));
    vi.stubGlobal("fetch", fetch);
    const initial = createSupabaseRouteClient(new NextRequest("https://app.example/login"));
    await initial.supabase.auth.signInWithPassword({ email: user.email, password: "test" });
    const response = initial.withSession(NextResponse.json({ ok: true }));
    const cookie = response.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join("; ");
    const next = createSupabaseRouteClient(new NextRequest("https://app.example/admin", { headers: { cookie } }));
    const result = await next.supabase.auth.getUser();
    expect(result.data.user).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it("fails closed on missing, null and foreign origins", () => {
    for (const origin of [undefined, "null", "https://app.example.attacker.test"]) {
      const request = new NextRequest("https://app.example/api/admin/login", {
        headers: origin ? { origin } : {}
      });
      expect(isSameOrigin(request)).toBe(false);
    }
  });
});
