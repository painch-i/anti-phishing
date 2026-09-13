import { afterEach, describe, expect, it, vi } from "vitest";

import { requiredEnvFrom } from "@/lib/env";

describe("requiredEnvFrom", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the first configured environment variable", () => {
    vi.stubEnv("PRIMARY_TEST_ENV", "primary-value");
    vi.stubEnv("FALLBACK_TEST_ENV", "fallback-value");

    expect(requiredEnvFrom(["PRIMARY_TEST_ENV", "FALLBACK_TEST_ENV"])).toBe("primary-value");
  });

  it("falls back to the next configured environment variable", () => {
    vi.stubEnv("FALLBACK_TEST_ENV", "fallback-value");

    expect(requiredEnvFrom(["PRIMARY_TEST_ENV", "FALLBACK_TEST_ENV"])).toBe("fallback-value");
  });

  it("reports every accepted environment variable name when none is set", () => {
    expect(() => requiredEnvFrom(["PRIMARY_TEST_ENV", "FALLBACK_TEST_ENV"])).toThrow(
      "Missing required environment variable: PRIMARY_TEST_ENV or FALLBACK_TEST_ENV"
    );
  });
});
