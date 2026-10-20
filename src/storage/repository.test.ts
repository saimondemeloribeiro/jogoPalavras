import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyStats, loadState } from "./repository";

const emptySession = (puzzleId: string) => ({ puzzleId, guesses: [], status: "playing" as const });

afterEach(() => vi.unstubAllGlobals());

describe("loadState", () => {
  it("rejects a playing session that already used all six guesses", () => {
    const guesses = ["PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO"].map((word) => ({
      word,
      marks: ["absent", "absent", "absent", "absent", "absent"],
    }));
    const stored = JSON.stringify({ session: { puzzleId: "2026-10-20", guesses, status: "playing" }, stats: emptyStats() });
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => stored) });

    expect(loadState("2026-10-20")).toEqual({ state: null, error: "invalid" });
  });

  it("keeps statistics while dropping a prior day's session", () => {
    const stats = { ...emptyStats(), played: 2 };
    const stored = JSON.stringify({ session: emptySession("2026-10-19"), stats });
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => stored) });

    expect(loadState("2026-10-20")).toEqual({ state: { session: null, stats }, error: null });
  });
});
