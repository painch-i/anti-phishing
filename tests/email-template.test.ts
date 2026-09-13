import { describe, expect, it } from "vitest";

import { renderVerdictEmail } from "@/lib/email-template";

describe("renderVerdictEmail", () => {
  it("includes the verdict, reference, explanation and uncertainty wording", () => {
    const email = renderVerdictEmail({
      to: "visitor@example.com",
      reference: "AP-20260913-ABCDEF12",
      verdict: "likely_phishing",
      explanation: "Le domaine ne correspond pas à la marque annoncée."
    });

    expect(email.subject).toContain("AP-20260913-ABCDEF12");
    expect(email.text).toContain("Probable phishing");
    expect(email.text).toContain("Le domaine ne correspond pas");
    expect(email.text).toContain("ne constitue pas une certification absolue");
  });

  it("escapes explanation content in HTML", () => {
    const email = renderVerdictEmail({
      to: "visitor@example.com",
      reference: "AP-20260913-ABCDEF12",
      verdict: "suspicious",
      explanation: "<script>alert('x')</script>"
    });

    expect(email.html).toContain("&lt;script&gt;");
    expect(email.html).not.toContain("<script>alert");
  });
});
