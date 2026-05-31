import { describe, expect, it } from "vitest";
import {
  energyProximity,
  hasDealbreakerConflict,
  jaccard,
  personalityAlignment,
  scoreCompatibility,
} from "./scoring.js";
import { EMPTY_PERSONALITY, type TasteProfile } from "./taste.js";

function profile(overrides: Partial<TasteProfile> = {}): TasteProfile {
  return {
    interests: [],
    values: [],
    personalityTraits: { ...EMPTY_PERSONALITY },
    dealbreakers: [],
    idealDateVibe: "",
    energyLevel: "medium",
    ...overrides,
  };
}

describe("jaccard", () => {
  it("is 1 for identical sets", () => {
    expect(jaccard(["a", "b"], ["b", "a"])).toBe(1);
  });
  it("is 0 for disjoint sets", () => {
    expect(jaccard(["a"], ["b"])).toBe(0);
  });
  it("is case-insensitive and trims", () => {
    expect(jaccard([" Hiking "], ["hiking"])).toBe(1);
  });
  it("computes partial overlap", () => {
    // intersection {a} = 1, union {a,b,c} = 3
    expect(jaccard(["a", "b"], ["a", "c"])).toBeCloseTo(1 / 3);
  });
});

describe("energyProximity", () => {
  it("is 1 when equal", () => {
    expect(energyProximity("high", "high")).toBe(1);
  });
  it("is 0.5 one step apart", () => {
    expect(energyProximity("low", "medium")).toBe(0.5);
  });
  it("is 0 two steps apart", () => {
    expect(energyProximity("low", "high")).toBe(0);
  });
});

describe("personalityAlignment", () => {
  it("is 1 for identical traits", () => {
    expect(personalityAlignment(EMPTY_PERSONALITY, EMPTY_PERSONALITY)).toBe(1);
  });
  it("is lower when traits diverge", () => {
    const a = { ...EMPTY_PERSONALITY, warmth: 1 };
    const b = { ...EMPTY_PERSONALITY, warmth: 0 };
    expect(personalityAlignment(a, b)).toBeLessThan(1);
  });
});

describe("hasDealbreakerConflict", () => {
  it("detects a dealbreaker matching the other's interest", () => {
    const a = profile({ dealbreakers: ["smoking"] });
    const b = profile({ interests: ["Smoking"] });
    expect(hasDealbreakerConflict(a, b)).toBe(true);
  });
  it("returns false when no conflict", () => {
    const a = profile({ dealbreakers: ["smoking"] });
    const b = profile({ interests: ["hiking"] });
    expect(hasDealbreakerConflict(a, b)).toBe(false);
  });
});

describe("scoreCompatibility", () => {
  it("returns a perfect-ish score for highly aligned profiles", () => {
    const a = profile({
      interests: ["hiking", "coffee", "books"],
      values: ["honesty", "growth"],
      energyLevel: "high",
    });
    const b = profile({
      interests: ["hiking", "coffee", "books"],
      values: ["honesty", "growth"],
      energyLevel: "high",
    });
    const result = scoreCompatibility(a, b);
    expect(result.total).toBe(100);
    expect(result.dealbreakerHit).toBe(false);
  });

  it("zeroes the total on a dealbreaker conflict", () => {
    const a = profile({ interests: ["hiking"], dealbreakers: ["smoking"] });
    const b = profile({ interests: ["hiking", "smoking"] });
    const result = scoreCompatibility(a, b);
    expect(result.dealbreakerHit).toBe(true);
    expect(result.total).toBe(0);
  });

  it("produces a mid-range score for partial overlap", () => {
    const a = profile({ interests: ["hiking", "coffee"], energyLevel: "low" });
    const b = profile({ interests: ["coffee", "gaming"], energyLevel: "high" });
    const result = scoreCompatibility(a, b);
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThan(100);
  });
});
