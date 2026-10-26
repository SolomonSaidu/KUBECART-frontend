import { describe, expect, it } from "vitest";
import {
  createIdempotencyKey,
  formatDate,
  formatMoney,
  getErrorMessage,
  getPrimaryImage,
  slugify,
} from "./format";

describe("formatMoney", () => {
  it("formats kobo as naira without decimals by default", () => {
    const value = formatMoney(123456);
    expect(value).toContain("1,235");
    expect(value).not.toContain(".00");
  });

  it("supports explicit decimal places", () => {
    expect(formatMoney(123456, { decimals: 2 })).toContain("1,234.56");
  });

  it("treats missing values as zero", () => {
    expect(formatMoney(null)).toContain("0");
  });
});

describe("formatDate", () => {
  it("returns a dash for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("\u2014");
    expect(formatDate("not-a-date")).toBe("\u2014");
  });

  it("formats a valid ISO date", () => {
    expect(formatDate("2026-01-15T10:30:00.000Z")).not.toBe("\u2014");
  });
});

describe("slugify", () => {
  it("normalizes whitespace and punctuation", () => {
    expect(slugify("  Men's Running Shoes!  ")).toBe("men-s-running-shoes");
  });

  it("trims leading and trailing hyphens and limits length", () => {
    expect(slugify("--Hello World--")).toBe("hello-world");
    expect(slugify("a".repeat(150))).toHaveLength(100);
  });
});

describe("getPrimaryImage", () => {
  const primary = { id: "2", url: "primary.jpg", isPrimary: true };
  const fallback = { id: "1", url: "first.jpg", isPrimary: false };

  it("prefers the primary image", () => {
    expect(getPrimaryImage([fallback, primary])).toBe(primary);
  });

  it("falls back to the first image or null", () => {
    expect(getPrimaryImage([fallback])).toBe(fallback);
    expect(getPrimaryImage([])).toBeNull();
    expect(getPrimaryImage(null)).toBeNull();
  });
});

describe("getErrorMessage", () => {
  it("uses the error message when present", () => {
    expect(getErrorMessage(new Error("Network down"))).toBe("Network down");
  });

  it("uses the fallback for empty errors", () => {
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});

describe("createIdempotencyKey", () => {
  it("returns a unique UUID-shaped value", () => {
    const first = createIdempotencyKey();
    const second = createIdempotencyKey();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[0-9a-f-]{32,36}$/i);
  });
});
