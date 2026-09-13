import "server-only";

import { Resend } from "resend";

import { renderVerdictEmail, type VerdictEmailInput } from "@/lib/email-template";
import { requiredEnv, requiredEnvFrom } from "@/lib/env";

function getResendFrom(): string {
  const configuredFrom = process.env.RESEND_FROM?.trim();

  if (configuredFrom) {
    return configuredFrom;
  }

  const domain = requiredEnvFrom(["RESEND_EMAIL_DOMAIN"]).trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!domain || domain.includes("/") || domain.includes("@")) {
    throw new Error("RESEND_EMAIL_DOMAIN must contain a valid email domain");
  }

  return `Anti-Phishing <security@${domain}>`;
}

export async function sendVerdictEmail(input: VerdictEmailInput): Promise<void> {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const rendered = renderVerdictEmail(input);
  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: input.to,
    subject: rendered.subject,
    text: rendered.text,
    html: rendered.html
  });

  if (error) {
    throw new Error(error.message);
  }
}
