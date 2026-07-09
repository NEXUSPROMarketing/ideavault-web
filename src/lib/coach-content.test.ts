import { describe, expect, it } from "vitest";
import { STICKING_POINTS, getStickingPoint } from "@/lib/coach-content";

describe("coach content library", () => {
  it("ships twelve sticking points", () => {
    expect(STICKING_POINTS).toHaveLength(12);
  });

  it("has unique, url-safe ids", () => {
    const ids = STICKING_POINTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("every point is fully authored", () => {
    for (const p of STICKING_POINTS) {
      expect(p.name.length).toBeGreaterThan(5);
      expect(p.symptom.length).toBeGreaterThan(40);
      expect(p.questions).toHaveLength(2);
      expect(p.focus.length).toBeGreaterThan(80);
    }
  });

  it("looks up by id", () => {
    expect(getStickingPoint("dead-launch")?.name).toBe("Launched to silence");
    expect(getStickingPoint("nope")).toBeUndefined();
  });
});
