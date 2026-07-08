import { describe, expect, it } from "vitest";
import {
  canSendChatMessage,
  computeTier,
  extractPeriodEnd,
  packRequiresPro,
  tierForSubscriptionStatus,
} from "@/lib/billing";

const NOW = new Date("2026-07-08T12:00:00Z");

describe("computeTier", () => {
  it("is free with no row or a free row", () => {
    expect(computeTier(null, NOW)).toBe("free");
    expect(computeTier({ tier: "free", current_period_end: null }, NOW)).toBe("free");
  });
  it("is pro with a pro row and a future period end", () => {
    expect(
      computeTier({ tier: "pro", current_period_end: "2026-08-01T00:00:00Z" }, NOW),
    ).toBe("pro");
  });
  it("trusts pro with no recorded period end", () => {
    expect(computeTier({ tier: "pro", current_period_end: null }, NOW)).toBe("pro");
  });
  it("keeps pro within the 24h grace window, drops it after", () => {
    expect(
      computeTier({ tier: "pro", current_period_end: "2026-07-08T02:00:00Z" }, NOW),
    ).toBe("pro"); // 10h past end — within grace
    expect(
      computeTier({ tier: "pro", current_period_end: "2026-07-06T00:00:00Z" }, NOW),
    ).toBe("free"); // 2.5 days past end
  });
});

describe("tierForSubscriptionStatus", () => {
  it("maps active-ish statuses to pro", () => {
    expect(tierForSubscriptionStatus("active")).toBe("pro");
    expect(tierForSubscriptionStatus("trialing")).toBe("pro");
    expect(tierForSubscriptionStatus("past_due")).toBe("pro");
  });
  it("maps ended statuses to free", () => {
    expect(tierForSubscriptionStatus("canceled")).toBe("free");
    expect(tierForSubscriptionStatus("unpaid")).toBe("free");
    expect(tierForSubscriptionStatus(null)).toBe("free");
  });
});

describe("extractPeriodEnd", () => {
  it("reads a top-level epoch (older API shape)", () => {
    expect(extractPeriodEnd({ current_period_end: 1782950400 })).toBe(
      new Date(1782950400 * 1000).toISOString(),
    );
  });
  it("reads the item-level epoch (newer API shape)", () => {
    expect(
      extractPeriodEnd({ items: { data: [{ current_period_end: 1782950400 }] } }),
    ).toBe(new Date(1782950400 * 1000).toISOString());
  });
  it("returns null when absent", () => {
    expect(extractPeriodEnd({})).toBeNull();
    expect(extractPeriodEnd(null)).toBeNull();
  });
});

describe("canSendChatMessage", () => {
  it("allows below the limit and blocks at it", () => {
    expect(canSendChatMessage(0, 50)).toBe(true);
    expect(canSendChatMessage(49, 50)).toBe(true);
    expect(canSendChatMessage(50, 50)).toBe(false);
  });
});

describe("packRequiresPro", () => {
  it("frees only the daily-drop idea", () => {
    expect(packRequiresPro("some-idea", "daily-idea")).toBe(true);
    expect(packRequiresPro("daily-idea", "daily-idea")).toBe(false);
    expect(packRequiresPro("some-idea", null)).toBe(true);
  });
});
