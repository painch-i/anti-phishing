import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  MAX_CONTEXT_LENGTH,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TEXT_LENGTH,
  MAX_TOTAL_FILE_SIZE_BYTES,
  MAX_URLS
} from "@/lib/submission-constraints";

export type SubmissionInput = {
  responseEmail: string;
  submittedText: string | null;
  submittedUrls: string[];
  context: string | null;
  files: File[];
};

export type ValidationErrors = Record<string, string[]>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: ValidationErrors };

function addError(errors: ValidationErrors, field: string, message: string): void {
  errors[field] = [...(errors[field] ?? []), message];
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hasAcceptedExtension(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();

  return ACCEPTED_FILE_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

function hasAcceptedFileType(file: File): boolean {
  return ACCEPTED_FILE_TYPES.includes(file.type) || hasAcceptedExtension(file.name);
}

function parseUrls(value: string, errors: ValidationErrors): string[] {
  if (!value) {
    return [];
  }

  const rawUrls = value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (rawUrls.length > MAX_URLS) {
    addError(errors, "urls", `Ajoutez au maximum ${MAX_URLS} liens.`);
  }

  return rawUrls.slice(0, MAX_URLS).flatMap((rawUrl) => {
    try {
      const url = new URL(rawUrl);

      if (!["http:", "https:"].includes(url.protocol)) {
        addError(errors, "urls", "Seuls les liens HTTP et HTTPS sont acceptés.");
        return [];
      }

      return [url.toString()];
    } catch {
      addError(errors, "urls", `Le lien "${rawUrl}" n'est pas valide.`);
      return [];
    }
  });
}

function parseFiles(formData: FormData, errors: ValidationErrors): File[] {
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > MAX_FILES) {
    addError(errors, "files", `Ajoutez au maximum ${MAX_FILES} fichiers.`);
  }

  let totalSize = 0;
  const acceptedFiles = files.slice(0, MAX_FILES).filter((file) => {
    totalSize += file.size;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      addError(errors, "files", `${file.name} dépasse la taille maximale autorisée.`);
      return false;
    }

    if (!hasAcceptedFileType(file)) {
      addError(errors, "files", `${file.name} n'est pas dans un format accepté.`);
      return false;
    }

    return true;
  });

  if (totalSize > MAX_TOTAL_FILE_SIZE_BYTES) {
    addError(errors, "files", "La taille totale des fichiers dépasse la limite autorisée.");
  }

  return acceptedFiles;
}

export function validateSubmissionFormData(formData: FormData): ValidationResult<SubmissionInput> {
  const errors: ValidationErrors = {};
  const responseEmail = asString(formData.get("responseEmail")).toLowerCase();
  const submittedText = asString(formData.get("submittedText"));
  const context = asString(formData.get("context"));
  const submittedUrls = parseUrls(asString(formData.get("urls")), errors);
  const files = parseFiles(formData, errors);

  if (!responseEmail) {
    addError(errors, "responseEmail", "Ajoutez l'adresse email où recevoir la réponse.");
  } else if (!isEmail(responseEmail)) {
    addError(errors, "responseEmail", "Ajoutez une adresse email valide.");
  }

  if (submittedText.length > MAX_TEXT_LENGTH) {
    addError(errors, "submittedText", "Le texte copié est trop long.");
  }

  if (context.length > MAX_CONTEXT_LENGTH) {
    addError(errors, "context", "Le contexte est trop long.");
  }

  if (!submittedText && submittedUrls.length === 0 && files.length === 0) {
    addError(errors, "content", "Ajoutez au moins un élément à analyser.");
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      responseEmail,
      submittedText: submittedText || null,
      submittedUrls,
      context: context || null,
      files
    }
  };
}
