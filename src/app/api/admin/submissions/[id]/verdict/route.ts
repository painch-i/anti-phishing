import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";
import { type Verdict, verdicts } from "@/lib/domain";
import { recordVerdictAndSendEmail } from "@/lib/submissions";

export const runtime = "nodejs";

type VerdictRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isVerdict(value: string): value is Verdict {
  return verdicts.includes(value as Verdict);
}

export async function POST(request: NextRequest, context: VerdictRouteContext) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { supabase, withSession } = createSupabaseRouteClient(request);

  if (!(await getAdminSession(supabase))) {
    return withSession(NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303));
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const verdict = String(formData.get("verdict") ?? "");
  const explanation = String(formData.get("explanation") ?? "").trim();
  const detailUrl = new URL(`/admin/submissions/${id}`, request.url);

  if (!isVerdict(verdict) || explanation.length > 2_000) {
    detailUrl.searchParams.set("error", "invalid-verdict");
    return withSession(NextResponse.redirect(detailUrl, 303));
  }

  try {
    await recordVerdictAndSendEmail(supabase, {
      submissionId: id,
      verdict,
      explanation: explanation || null
    });
    detailUrl.searchParams.set("saved", "1");
  } catch (error) {
    console.error("Verdict delivery failed", error instanceof Error ? error.name : "UnknownError");
    detailUrl.searchParams.set("error", "email");
  }

  return withSession(NextResponse.redirect(detailUrl, 303));
}
