import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE_BYTES } from "@/lib/submission-constraints";
import { validateSubmissionFormData } from "@/lib/submission-validation";

function baseFormData() {
  const formData = new FormData();
  formData.set("responseEmail", "Visitor@Example.com");

  return formData;
}

describe("validateSubmissionFormData", () => {
  it("accepts a valid text and URL submission", () => {
    const formData = baseFormData();
    formData.set("submittedText", "Please reset your bank password immediately.");
    formData.set("urls", "https://example.com/login");

    const result = validateSubmissionFormData(formData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.responseEmail).toBe("visitor@example.com");
      expect(result.data.submittedUrls).toEqual(["https://example.com/login"]);
      expect(result.data.files).toHaveLength(0);
    }
  });

  it("rejects a submission without any suspicious content", () => {
    const result = validateSubmissionFormData(baseFormData());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.content).toContain("Ajoutez au moins un élément à analyser.");
    }
  });

  it("rejects an invalid response email", () => {
    const formData = baseFormData();
    formData.set("responseEmail", "not-an-email");
    formData.set("submittedText", "Suspicious message");

    const result = validateSubmissionFormData(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.responseEmail).toContain("Ajoutez une adresse email valide.");
    }
  });

  it("rejects unsupported file formats", () => {
    const formData = baseFormData();
    formData.append("files", new File(["hello"], "archive.zip", { type: "application/zip" }));

    const result = validateSubmissionFormData(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.files?.[0]).toContain("n'est pas dans un format accepté");
    }
  });

  it("rejects files above the per-file size limit", () => {
    const formData = baseFormData();
    const oversizedFile = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], "large.pdf", {
      type: "application/pdf"
    });
    formData.append("files", oversizedFile);

    const result = validateSubmissionFormData(formData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.files?.[0]).toContain("dépasse la taille maximale autorisée");
    }
  });
});
