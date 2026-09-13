import "server-only";

import { randomBytes } from "node:crypto";

export function createPublicReference(date = new Date()): string {
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = randomBytes(4).toString("hex").toUpperCase();

  return `AP-${datePart}-${randomPart}`;
}
