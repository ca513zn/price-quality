import { describe, it, expect } from "vitest";
import {
  slugify,
  getQuadrant,
  getQuadrantColor,
  computeAggregatedScores,
} from "@/lib/utils";

// ─── slugify ────────────────────────────────────────────────────────────────

describe("slugify", () => {
  it("converts a simple string to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces multiple spaces with a single dash", () => {
    expect(slugify("iPhone  16   Pro")).toBe("iphone-16-pro");
  });

  it("removes special characters", () => {
    expect(slugify("Rolex (Submariner) #1")).toBe("rolex-submariner-1");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("handles already slug-like strings", () => {
    expect(slugify("already-a-slug")).toBe("already-a-slug");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers only", () => {
    expect(slugify("12345")).toBe("12345");
  });

  it("handles accented and unicode characters by removing them", () => {
    expect(slugify("Café Résumé")).toBe("caf-r-sum");
  });
});

// ─── getQuadrant ────────────────────────────────────────────────────────────

describe("getQuadrant", () => {
  it("returns 'Premium' for high price and high quality", () => {
    expect(getQuadrant(8, 9)).toBe("Premium");
  });

  it("returns 'Best Value' for low price and high quality", () => {
    expect(getQuadrant(3, 8)).toBe("Best Value");
  });

  it("returns 'Overpriced' for high price and low quality", () => {
    expect(getQuadrant(8, 3)).toBe("Overpriced");
  });

  it("returns 'Budget' for low price and low quality", () => {
    expect(getQuadrant(2, 2)).toBe("Budget");
  });

  // Boundary cases at the midpoint (5)
  it("returns 'Premium' when both scores are exactly 5", () => {
    expect(getQuadrant(5, 5)).toBe("Premium");
  });

  it("returns 'Budget' when both scores are just below 5", () => {
    expect(getQuadrant(4.99, 4.99)).toBe("Budget");
  });

  it("returns 'Overpriced' for price=5, quality=4.99", () => {
    expect(getQuadrant(5, 4.99)).toBe("Overpriced");
  });

  it("returns 'Best Value' for price=4.99, quality=5", () => {
    expect(getQuadrant(4.99, 5)).toBe("Best Value");
  });

  // Edge values
  it("returns 'Budget' for minimum scores (1, 1)", () => {
    expect(getQuadrant(1, 1)).toBe("Budget");
  });

  it("returns 'Premium' for maximum scores (10, 10)", () => {
    expect(getQuadrant(10, 10)).toBe("Premium");
  });

  it("returns 'Overpriced' for (10, 1)", () => {
    expect(getQuadrant(10, 1)).toBe("Overpriced");
  });

  it("returns 'Best Value' for (1, 10)", () => {
    expect(getQuadrant(1, 10)).toBe("Best Value");
  });
});

// ─── getQuadrantColor ───────────────────────────────────────────────────────

describe("getQuadrantColor", () => {
  it("returns purple for Premium", () => {
    expect(getQuadrantColor("Premium")).toBe("#8b5cf6");
  });

  it("returns green for Best Value", () => {
    expect(getQuadrantColor("Best Value")).toBe("#10b981");
  });

  it("returns red for Overpriced", () => {
    expect(getQuadrantColor("Overpriced")).toBe("#ef4444");
  });

  it("returns amber for Budget", () => {
    expect(getQuadrantColor("Budget")).toBe("#f59e0b");
  });

  it("returns gray for unknown quadrant", () => {
    expect(getQuadrantColor("Unknown")).toBe("#6b7280");
  });

  it("returns gray for empty string", () => {
    expect(getQuadrantColor("")).toBe("#6b7280");
  });
});

// ─── computeAggregatedScores ────────────────────────────────────────────────

describe("computeAggregatedScores", () => {
  it("returns zeros for empty array", () => {
    const result = computeAggregatedScores([]);
    expect(result).toEqual({
      avgPriceScore: 0,
      avgQualityScore: 0,
      totalVotes: 0,
    });
  });

  it("returns zeros for null input", () => {
    const result = computeAggregatedScores(null);
    expect(result).toEqual({
      avgPriceScore: 0,
      avgQualityScore: 0,
      totalVotes: 0,
    });
  });

  it("returns zeros for undefined input", () => {
    const result = computeAggregatedScores(undefined);
    expect(result).toEqual({
      avgPriceScore: 0,
      avgQualityScore: 0,
      totalVotes: 0,
    });
  });

  it("computes correctly for a single vote", () => {
    const votes = [{ priceScore: 7, qualityScore: 9 }];
    const result = computeAggregatedScores(votes);
    expect(result).toEqual({
      avgPriceScore: 7,
      avgQualityScore: 9,
      totalVotes: 1,
    });
  });

  it("computes averages for multiple votes", () => {
    const votes = [
      { priceScore: 6, qualityScore: 8 },
      { priceScore: 8, qualityScore: 6 },
      { priceScore: 4, qualityScore: 10 },
    ];
    const result = computeAggregatedScores(votes);
    expect(result).toEqual({
      avgPriceScore: 6,
      avgQualityScore: 8,
      totalVotes: 3,
    });
  });

  it("rounds to 2 decimal places", () => {
    const votes = [
      { priceScore: 1, qualityScore: 1 },
      { priceScore: 2, qualityScore: 2 },
      { priceScore: 3, qualityScore: 3 },
    ];
    const result = computeAggregatedScores(votes);
    expect(result.avgPriceScore).toBe(2);
    expect(result.avgQualityScore).toBe(2);
  });

  it("handles non-even averages with proper rounding", () => {
    const votes = [
      { priceScore: 1, qualityScore: 10 },
      { priceScore: 2, qualityScore: 9 },
      { priceScore: 3, qualityScore: 8 },
    ];
    const result = computeAggregatedScores(votes);
    expect(result.avgPriceScore).toBe(2);
    expect(result.avgQualityScore).toBe(9);
    expect(result.totalVotes).toBe(3);
  });

  it("handles all minimum scores", () => {
    const votes = [
      { priceScore: 1, qualityScore: 1 },
      { priceScore: 1, qualityScore: 1 },
    ];
    const result = computeAggregatedScores(votes);
    expect(result.avgPriceScore).toBe(1);
    expect(result.avgQualityScore).toBe(1);
  });

  it("handles all maximum scores", () => {
    const votes = [
      { priceScore: 10, qualityScore: 10 },
      { priceScore: 10, qualityScore: 10 },
    ];
    const result = computeAggregatedScores(votes);
    expect(result.avgPriceScore).toBe(10);
    expect(result.avgQualityScore).toBe(10);
  });
});
