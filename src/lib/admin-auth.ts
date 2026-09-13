import "server-only";

import { redirect } from "next/navigation";

import { getSupabaseClient, type SupabaseClient } from "@/lib/supabase";

export async function getAdminSession(supabase?: SupabaseClient) {
  const client = supabase ?? await getSupabaseClient();
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user || user.is_anonymous) {
    return null;
  }

  const { data: isAdmin, error: roleError } = await client.rpc("is_admin");

  if (roleError || !isAdmin) {
    return null;
  }

  return user;
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
