import { describe, it, expect } from "vitest";
import { groupByDate } from "../lib/utils";
import { analyzeIntent } from "../lib/ezra";

describe("analyzeIntent", () => {
  it("detects spiritual", () => {
    expect(analyzeIntent("I will pray for clarity")).toBe("spiritual");
  });
  it("detects focus", () => {
    expect(analyzeIntent("deep work timer")).toBe("focus");
  });
  it("falls back to general", () => {
    expect(analyzeIntent("random text")).toBe("general");
  });
});

describe("groupByDate", () => {
  it("keeps only most recent per date", () => {
    const list = [
      { date: "2025-01-01", savedAt: 1, statement: "A" },
      { date: "2025-01-01", savedAt: 2, statement: "B" },
      { date: "2025-01-02", savedAt: 1, statement: "C" }
    ];
    const r = groupByDate(list);
    expect(r.length).toBe(2);
    expect(r.find(x=>x.date==="2025-01-01").statement).toBe("B");
  });
});
