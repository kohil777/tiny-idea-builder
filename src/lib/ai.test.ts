import { describe, expect, it } from "vitest";
import { askAgentAi } from "./ai.server";

describe("EcoAgent AI Copilot", () => {
  it("provides Bangalore BBMP waste segregation guidance", async () => {
    const res = await askAgentAi({
      prompt: "What are the BBMP garbage segregation rules in Bangalore?",
      context: { locality: "JP Nagar" },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toContain("BBMP");
      expect(res.data).toContain("JP Nagar");
      expect(res.data).toContain("2-Bin 1-Bag");
      expect(res.data).toContain("kg CO₂e");
    }
  });

  it("calculates commute comparisons using kg CO₂e units", async () => {
    const res = await askAgentAi({
      prompt: "Compare Metro vs cab carbon footprint for a 15 km trip",
      context: { locality: "Indiranagar" },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toContain("kg CO₂e");
      expect(res.data).toContain("Metro");
    }
  });

  it("handles user context with today's footprint and streak", async () => {
    const res = await askAgentAi({
      prompt: "How am I doing today?",
      context: { todayKg: 2.45, streak: 5, locality: "Jayanagar" },
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data).toContain("2.45 kg CO₂e");
      expect(res.data).toContain("5 days");
    }
  });
});

