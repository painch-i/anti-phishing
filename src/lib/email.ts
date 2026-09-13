import "server-only";

import { Resend } from "resend";

import { renderVerdictEmail, type VerdictEmailInput } from "@/lib/email-template";
import { requiredEnv } from "@/lib/env";

export async function sendVerdictEmail(input: VerdictEmailInput): Promise<void> {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const rendered = renderVerdictEmail(input);
  const { error } = await resend.emails.send({
    from: requiredEnv("RESEND_FROM"),
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html
  });

  if (error) {
    throw new Error(error.message);
  }
}
