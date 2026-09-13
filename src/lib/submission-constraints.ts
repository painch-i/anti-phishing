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

const fileTypesByExtension: Record<string, string> = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  eml: "message/rfc822",
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  msg: "application/vnd.ms-outlook",
  pdf: "application/pdf",
  png: "image/png",
  txt: "text/plain",
  webp: "image/webp"
};

export function getFileContentType(file: File): string {
  return ACCEPTED_FILE_TYPES.includes(file.type)
    ? file.type
    : fileTypesByExtension[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
}

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
