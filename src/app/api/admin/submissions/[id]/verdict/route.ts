import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/admin-auth";
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
  if (!getAdminSessionFromRequest(request)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const verdict = String(formData.get("verdict") ?? "");
  const explanation = String(formData.get("explanation") ?? "").trim();
  const detailUrl = new URL(`/admin/submissions/${id}`, request.url);

  if (!isVerdict(verdict)) {
    detailUrl.searchParams.set("error", "invalid-verdict");
    return NextResponse.redirect(detailUrl, 303);
  }

  try {
    await recordVerdictAndSendEmail({
      submissionId: id,
      verdict,
      explanation: explanation || null
    });
    detailUrl.searchParams.set("saved", "1");
  } catch (error) {
    console.error(error);
    detailUrl.searchParams.set("error", "email");
  }

  return NextResponse.redirect(detailUrl, 303);
}
