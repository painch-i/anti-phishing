import { type Verdict, verdictCopy } from "@/lib/domain";

export type VerdictEmailInput = {
  to: string;
  reference: string;
  verdict: Verdict;
  explanation: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderVerdictEmail(input: VerdictEmailInput): {
  subject: string;
  text: string;
  html: string;
} {
  const verdict = verdictCopy[input.verdict];
  const explanation = input.explanation?.trim();
  const uncertainty =
    "Cet avis est fourni à partir des éléments transmis. Il ne constitue pas une certification absolue d'authenticité ou de sécurité.";

  const text = [
    `Référence: ${input.reference}`,
    "",
    `Verdict: ${verdict.label}`,
    verdict.summary,
    ...(explanation ? ["", "Explication:", explanation] : []),
    "",
    uncertainty
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #17202a;">
      <p><strong>Référence:</strong> ${escapeHtml(input.reference)}</p>
      <p><strong>Verdict:</strong> ${escapeHtml(verdict.label)}</p>
      <p>${escapeHtml(verdict.summary)}</p>
      ${
        explanation
          ? `<p><strong>Explication:</strong><br>${escapeHtml(explanation).replaceAll("\n", "<br>")}</p>`
          : ""
      }
      <p style="color: #53606f;">${escapeHtml(uncertainty)}</p>
    </div>
  `;

  return {
    subject: `${verdict.emailSubject} (${input.reference})`,
    text,
    html
  };
}
