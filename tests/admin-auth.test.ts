import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminSession } from "@/lib/admin-auth";
import type { SupabaseClient } from "@/lib/supabase";

afterEach(() => vi.restoreAllMocks());

function client(user: object | null, isAdmin = false, error: object | null = null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error }) },
    rpc: vi.fn().mockResolvedValue({ data: isAdmin, error: null })
  };
}

describe("operator authorization", () => {
  it("requires a verified user, ignoring an untrusted session user on auth failure", async () => {
    const supabase = client({ id: "forged", app_metadata: { role: "admin" } }, true, { message: "Invalid JWT" });
    expect(await getAdminSession(supabase as unknown as SupabaseClient)).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("rejects missing and anonymous users before checking membership", async () => {
    for (const user of [null, { id: "guest", is_anonymous: true }]) {
      const supabase = client(user, true);
      expect(await getAdminSession(supabase as unknown as SupabaseClient)).toBeNull();
      expect(supabase.rpc).not.toHaveBeenCalled();
    }
  });

  it("checks database membership instead of trusting role metadata", async () => {
    const user = { id: "operator", is_anonymous: false, user_metadata: { role: "admin" } };
    const supabase = client(user);
    expect(await getAdminSession(supabase as unknown as SupabaseClient)).toBeNull();
    supabase.rpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await getAdminSession(supabase as unknown as SupabaseClient)).toEqual(user);
    expect(supabase.rpc).toHaveBeenCalledWith("is_admin");
  });

  it("fails closed when membership lookup fails", async () => {
    const supabase = client({ id: "operator", is_anonymous: false }, true);
    supabase.rpc.mockResolvedValueOnce({ data: true, error: { message: "Unavailable" } });
    expect(await getAdminSession(supabase as unknown as SupabaseClient)).toBeNull();
  });
});
