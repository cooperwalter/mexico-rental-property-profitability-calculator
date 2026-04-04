import { describe, expect, test } from "bun:test";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  toNumber,
} from "./format";

describe("formatNumber", () => {
  test("should format positive integers with commas", () => {
    expect(formatNumber(1_234_567)).toBe("1,234,567");
  });

  test("should format negative numbers as absolute value", () => {
    expect(formatNumber(-50_000)).toBe("50,000");
  });

  test("should format 0 as '0'", () => {
    expect(formatNumber(0)).toBe("0");
  });

  test("should include decimal places when specified", () => {
    expect(formatNumber(1234.5, 2)).toBe("1,234.50");
  });

  test("should pad with trailing zeros to meet decimal places", () => {
    expect(formatNumber(100, 2)).toBe("100.00");
  });

  test("should handle very large numbers", () => {
    expect(formatNumber(999_999_999)).toBe("999,999,999");
  });
});

describe("formatCurrency", () => {
  test("should format positive amounts with $ prefix", () => {
    expect(formatCurrency(50_000)).toBe("$50,000");
  });

  test("should format negative amounts with minus sign and $ prefix", () => {
    expect(formatCurrency(-12_345)).toBe("\u2212$12,345");
    expect(formatCurrency(-12_345)).toContain("$");
  });

  test("should format 0 as '$0'", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  test("should respect decimal places parameter", () => {
    expect(formatCurrency(1234.5, 2)).toBe("$1,234.50");
  });

  test("should use unicode minus (U+2212) not hyphen for negative", () => {
    const result = formatCurrency(-1);
    expect(result.charCodeAt(0)).toBe(0x2212);
  });
});

describe("formatPercent", () => {
  test("should format with one decimal place and % suffix", () => {
    expect(formatPercent(5)).toBe("5.0%");
  });

  test("should format fractional percentages", () => {
    expect(formatPercent(12.34)).toBe("12.3%");
  });

  test("should format 0 as '0.0%'", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  test("should format negative percentages", () => {
    expect(formatPercent(-3.7)).toBe("-3.7%");
  });

  test("should round to one decimal place", () => {
    expect(formatPercent(8.999)).toBe("9.0%");
  });
});

describe("toNumber", () => {
  test("should return 0 for empty string", () => {
    expect(toNumber("")).toBe(0);
  });

  test("should pass through numeric values unchanged", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-10)).toBe(-10);
    expect(toNumber(3.14)).toBe(3.14);
  });
});
