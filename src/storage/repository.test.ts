import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyStats, loadState, saveState } from "./repository";

const emptySession = (puzzleId: string) => ({ puzzleId, guesses: [], status: "playing" as const });

afterEach(() => vi.unstubAllGlobals());

describe("loadState", () => {
  it("returns an empty result when storage has no saved state", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => null) });

    expect(loadState("2026-10-20")).toEqual({ state: null, error: null });
  });

  it("reports invalid JSON without throwing", () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => "{") });

    expect(loadState("2026-10-20")).toEqual({ state: null, error: "invalid" });
  });

  it("reports storage access errors", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => { throw new Error("storage unavailable"); }),
    });

    expect(loadState("2026-10-20")).toEqual({ state: null, error: "unavailable" });
  });

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

  it("rejects malformed statistics and guesses", () => {
    const invalidStates = [
      { session: null, stats: { ...emptyStats(), played: -1 } },
      { session: null, stats: { ...emptyStats(), guessDistribution: [0, 0] } },
      {
        session: {
          puzzleId: "2026-10-20",
          guesses: [{ word: "PLUMA", marks: ["correct", "unknown", "correct", "correct", "correct"] }],
          status: "won",
        },
        stats: emptyStats(),
      },
    ];

    for (const state of invalidStates) {
      vi.stubGlobal("localStorage", { getItem: vi.fn(() => JSON.stringify(state)) });
      expect(loadState("2026-10-20")).toEqual({ state: null, error: "invalid" });
    }
  });
});

describe("saveState", () => {
  it("serializes the state to local storage and reports success", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    const state = { session: emptySession("2026-10-20"), stats: emptyStats() };

    expect(saveState(state)).toBe(true);
    expect(setItem).toHaveBeenCalledWith("jogoPalavras:v1", JSON.stringify(state));
  });

  it("reports storage write errors", () => {
    vi.stubGlobal("localStorage", {
      setItem: vi.fn(() => { throw new Error("storage unavailable"); }),
    });

    expect(saveState({ session: null, stats: emptyStats() })).toBe(false);
  });
});
