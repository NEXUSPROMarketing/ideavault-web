import { describe, expect, it } from "vitest";
import {
  budgetScore,
  computeFit,
  gtmFitScore,
  hoursScore,
  parseCostRange,
  rankIdeas,
  tokenize,
} from "@/lib/fit";
import type { FitIdea, Profile } from "@/lib/schemas";

function mkIdea(overrides: Partial<FitIdea> = {}): FitIdea {
  return {
    slug: "test-idea",
    title: "AI Coaching Platform for GLP-1 Users",
    tagline: "Coaching and nutrition support for weight-loss patients",
    category: "Health & Wellness",
    signal_tags: ["Proven Demand"],
    keyword: "glp-1 coaching",
    score_overall: 80,
    score_opportunity: 8,
    score_problem: 8,
    score_feasibility: 8,
    score_why_now: 8,
    revenue_tier: "$$$",
    execution_difficulty: 3,
    gtm_score: 8,
    is_flagship: false,
    released: "2026-01-01",
    startup_costs: "$3K-$7K",
    ...overrides,
  };
}

const profile: Profile = {
  skills: "AI, coaching, nutrition apps",
  interests: "health and wellness",
  budget: "5k-15k",
  hours: "10-20",
  technical: "technical",
  audience: "small",
  goal: "side income",
};

describe("tokenize", () => {
  it("drops stopwords, keeps short domain tokens like ai, dedupes and stems plurals", () => {
    const tokens = tokenize("The AI apps and coaching apps for founders");
    expect(tokens).toContain("ai");
    expect(tokens).toContain("app");
    expect(tokens).toContain("coaching");
    expect(tokens).toContain("founder");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("for");
    expect(tokens.filter((t) => t === "app")).toHaveLength(1);
  });
});

describe("parseCostRange", () => {
  it("parses K ranges", () => {
    expect(parseCostRange("$3K-$7K")).toEqual({ min: 3000, max: 7000 });
  });
  it("parses single values", () => {
    expect(parseCostRange("$500")).toEqual({ min: 500, max: 500 });
  });
  it("parses open-ended values", () => {
    expect(parseCostRange("$10K+")).toEqual({ min: 10000, max: 10000 });
  });
  it("falls back on null", () => {
    expect(parseCostRange(null)).toEqual({ min: 2000, max: 8000 });
  });
});

describe("budgetScore", () => {
  it("is 1 when the budget covers the top of the range", () => {
    expect(budgetScore("5k-15k", "$3K-$7K")).toBe(1);
  });
  it("is 0.55 when only the low end is covered", () => {
    expect(budgetScore("under-1k", "$500-$2K")).toBe(0.55);
  });
  it("is 0.15 when out of reach", () => {
    expect(budgetScore("under-1k", "$5K-$10K")).toBe(0.15);
  });
});

describe("hoursScore", () => {
  it("rewards capacity meeting demand", () => {
    expect(hoursScore("10-20", 6)).toBe(1);
    expect(hoursScore("under-5", 2)).toBe(1);
  });
  it("softens a one-band shortfall", () => {
    expect(hoursScore("5-10", 6)).toBe(0.6);
  });
  it("penalizes a big gap", () => {
    expect(hoursScore("under-5", 8)).toBe(0.25);
  });
});

describe("gtmFitScore", () => {
  it("boosts an established audience and caps at 1", () => {
    expect(gtmFitScore("established", 10)).toBe(1);
    expect(gtmFitScore("established", 8)).toBeCloseTo(0.88, 5);
    expect(gtmFitScore("none", 8)).toBeCloseTo(0.72, 5);
  });
});

describe("computeFit", () => {
  it("is deterministic", () => {
    const a = computeFit(profile, mkIdea());
    const b = computeFit(profile, mkIdea());
    expect(a).toEqual(b);
  });
  it("scores a strong match near the top of the scale", () => {
    const { score, reasons } = computeFit(profile, mkIdea());
    expect(score).toBeGreaterThanOrEqual(85);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons[0]).toMatch(/^Matches:/);
  });
  it("scores an off-profile idea low", () => {
    const off = mkIdea({
      title: "Freight Quote Automation",
      tagline: "Logistics pricing tools",
      category: "Developer Tools & Infra",
      signal_tags: [],
      keyword: "freight quotes",
      execution_difficulty: 8,
      gtm_score: 4,
      startup_costs: "$40K-$60K",
    });
    const { score } = computeFit(profile, off);
    expect(score).toBeLessThan(40);
  });
});

describe("rankIdeas", () => {
  it("orders by fit, then overall score, then slug", () => {
    const strong = mkIdea({ slug: "strong" });
    const weak = mkIdea({
      slug: "weak",
      title: "Freight Quote Automation",
      tagline: "Logistics pricing",
      category: "Developer Tools & Infra",
      keyword: "freight",
      signal_tags: [],
      gtm_score: 3,
      execution_difficulty: 9,
      startup_costs: "$40K",
    });
    const twinA = mkIdea({ slug: "twin-a", score_overall: 70 });
    const twinB = mkIdea({ slug: "twin-b", score_overall: 90 });

    const ranked = rankIdeas(profile, [weak, twinA, strong, twinB]);
    const slugs = ranked.map((r) => r.idea.slug);
    expect(slugs[slugs.length - 1]).toBe("weak");
    expect(slugs.indexOf("twin-b")).toBeLessThan(slugs.indexOf("twin-a"));
  });
});
