import { describe, expect, it } from "vitest";
import { getAllowedGuesses, isAllowedGuess, puzzleForDate } from "./catalog";

describe("daily puzzle catalog", () => {
  it("selects a stable puzzle by UTC day", () => {
    const morning = puzzleForDate(new Date("2026-10-20T01:00:00.000Z"));
    const evening = puzzleForDate(new Date("2026-10-20T23:00:00.000Z"));
    const nextDay = puzzleForDate(new Date("2026-10-21T00:00:00.000Z"));
    expect(morning).toEqual(evening);
    expect(nextDay.id).not.toBe(morning.id);
  });

  it("accepts normalized words from the curated sample", () => {
    expect(isAllowedGuess("limão")).toBe(true);
    expect(isAllowedGuess("inventada")).toBe(false);
    expect(getAllowedGuesses().size).toBeGreaterThan(20);
  });
});
