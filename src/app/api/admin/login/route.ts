import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { supabase, withSession } = createSupabaseRouteClient(request);
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !(await getAdminSession(supabase))) {
    await supabase.auth.signOut({ scope: "local" });
    return withSession(NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303));
  }

  return withSession(NextResponse.redirect(new URL("/admin", request.url), 303));
}
