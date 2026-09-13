export const MAX_FILES = 5;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 20_000;
export const MAX_CONTEXT_LENGTH = 4_000;
export const MAX_URLS = 10;

export const ACCEPTED_FILE_TYPES = [
  "application/msword",
  "application/pdf",
  "application/vnd.ms-outlook",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "message/rfc822",
  "text/plain"
];

export const ACCEPTED_FILE_EXTENSIONS = [
  ".doc",
  ".docx",
  ".eml",
  ".gif",
  ".jpeg",
  ".jpg",
  ".msg",
  ".pdf",
  ".png",
  ".txt",
  ".webp"
];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
