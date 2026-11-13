import { describe, expect, it } from "vitest";
import {
  billEmission,
  categoryTotalsForDay,
  changeVsLastWeek,
  greenStreak,
  guessModeFromSpeed,
  suggestTravel,
  travelEmission,
  wasteEmission,
  type DatedAmount,
} from "./emissions";

const at = (daysAgo: number, kg: number, category: DatedAmount["category"] = "food"): DatedAmount => {
  const d = new Date(2026, 10, 13, 12);
  d.setDate(d.getDate() - daysAgo);
  return { date: d.toISOString(), kg, category };
};
const NOW = new Date(2026, 10, 13, 18);

describe("travel", () => {
  it("splits car emissions between passengers", () => {
    expect(travelEmission("car", 10, 1)).toBe(1.92);
    expect(travelEmission("car", 10, 4)).toBe(0.48);
  });
  it("does not split bus emissions by passengers", () => {
    expect(travelEmission("bus", 10, 4)).toBe(0.89);
  });
  it("suggests carpooling for a solo car trip but not when 3+ people share", () => {
    expect(suggestTravel("car", 10, 1).some((s) => s.mode === "car")).toBe(true);
    expect(suggestTravel("car", 10, 3).some((s) => s.mode === "bus")).toBe(false);
  });
  it("guesses the vehicle from speed", () => {
    expect(guessModeFromSpeed(4)).toBe("walk");
    expect(guessModeFromSpeed(14)).toBe("cycle");
    expect(guessModeFromSpeed(40)).toBe("car");
  });
});

describe("bills and waste", () => {
  it("uses 0.71 kg per kWh of electricity", () => {
    expect(billEmission("electricity", 100)).toBe(71);
  });
  it("landfill waste emits more than recycled", () => {
    expect(wasteEmission("landfill", 2)).toBe(1.16);
    expect(wasteEmission("recycled", 2)).toBe(0.04);
  });
});

describe("green streak", () => {
  it("counts consecutive logged days within the 10 kg target", () => {
    const e = [at(0, 5), at(1, 8), at(2, 9.5), at(3, 12)];
    expect(greenStreak(e, NOW)).toBe(3);
  });
  it("starts from yesterday when today has no logs yet", () => {
    expect(greenStreak([at(1, 4), at(2, 4)], NOW)).toBe(2);
  });
  it("ignores reuse savings in the daily footprint", () => {
    expect(greenStreak([at(0, 9, "food"), at(0, 30, "reuse")], NOW)).toBe(1);
  });
});

describe("bills spread over their period", () => {
  it("a 300 kg monthly bill adds 10 kg to each of 30 days", () => {
    const e: DatedAmount[] = [{ ...at(0, 300, "bills"), spreadDays: 30 }];
    expect(categoryTotalsForDay(e, NOW).bills).toBe(10);
    const d = new Date(NOW);
    d.setDate(d.getDate() - 29);
    expect(categoryTotalsForDay(e, d).bills).toBe(10);
    d.setDate(d.getDate() - 1);
    expect(categoryTotalsForDay(e, d).bills).toBe(0);
  });
});

describe("change vs last week", () => {
  it("compares today with the previous 7-day average", () => {
    const e = [at(0, 8), ...[1, 2, 3, 4, 5, 6, 7].map((d) => at(d, 10))];
    expect(changeVsLastWeek(e, NOW)).toBe(-20);
  });
});
