import { NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(), signOut: vi.fn(), getAdminSession: vi.fn(),
  recordVerdictAndSendEmail: vi.fn()
}));

vi.mock("@/lib/admin-auth", () => ({ getAdminSession: mocks.getAdminSession }));
vi.mock("@/lib/submissions", () => ({ recordVerdictAndSendEmail: mocks.recordVerdictAndSendEmail }));
vi.mock("@/lib/supabase-route", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/supabase-route")>(),
  createSupabaseRouteClient: () => ({
    supabase: { auth: { signInWithPassword: mocks.signInWithPassword, signOut: mocks.signOut } },
    withSession: (response: NextResponse) => {
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
  })
}));

import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { POST as verdict } from "@/app/api/admin/submissions/[id]/verdict/route";

const origin = "https://anti-phishing.example";
const context = { params: Promise.resolve({ id: "submission-1" }) };

function request(path: string, fields: Record<string, string> = {}, from = origin) {
  return new NextRequest(`${origin}${path}`, {
    method: "POST", headers: { origin: from }, body: new URLSearchParams(fields)
  });
}

describe("admin routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it("rejects cross-origin login, logout and verdict requests", async () => {
    expect((await login(request("/api/admin/login", {}, "https://attacker.example"))).status).toBe(403);
    expect((await logout(request("/api/admin/logout", {}, "https://attacker.example"))).status).toBe(403);
    expect((await verdict(request("/api/admin/submissions/1/verdict", {}, "null"), context)).status).toBe(403);
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.recordVerdictAndSendEmail).not.toHaveBeenCalled();
  });

  it("signs in an operator through Supabase", async () => {
    mocks.getAdminSession.mockResolvedValue({ id: "operator" });
    const response = await login(request("/api/admin/login", { email: "admin@example.com", password: "test-password" }));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "admin@example.com", password: "test-password" });
    expect(response.headers.get("location")).toBe(`${origin}/admin`);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("clears the local session after invalid credentials or denied membership", async () => {
    mocks.getAdminSession.mockResolvedValue(null);
    const deniedResponse = await login(request("/api/admin/login"));
    expect(deniedResponse.headers.get("location")).toContain("/admin/login?error=1");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    mocks.signInWithPassword.mockResolvedValue({ error: { message: "Invalid credentials" } });
    expect((await login(request("/api/admin/login"))).headers.get("location")).toContain("error=1");
  });

  it("logs out using Supabase session revocation", async () => {
    const response = await logout(request("/api/admin/logout"));
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.headers.get("location")).toBe(`${origin}/admin/login`);
  });

  it("never sends an email for an unauthenticated or non-admin account", async () => {
    mocks.getAdminSession.mockResolvedValue(null);
    const response = await verdict(request("/api/admin/submissions/1/verdict", { verdict: "legitimate" }), context);
    expect(response.headers.get("location")).toContain("/admin/login");
    expect(mocks.recordVerdictAndSendEmail).not.toHaveBeenCalled();
  });

  it("validates verdict input before accessing data or sending email", async () => {
    mocks.getAdminSession.mockResolvedValue({ id: "operator" });
    await verdict(request("/api/admin/submissions/1/verdict", { verdict: "invalid" }), context);
    await verdict(request("/api/admin/submissions/1/verdict", { verdict: "legitimate", explanation: "x".repeat(2001) }), context);
    expect(mocks.recordVerdictAndSendEmail).not.toHaveBeenCalled();
  });
});
