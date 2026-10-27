import { describe, expect, it } from "vitest";
import { recordCompletedGame, winRate, type PlayerStats } from "./aggregate";
import { createSession } from "../game/session";
import type { LetterMark } from "../game/score";

const emptyStats: PlayerStats = { played: 0, wins: 0, currentStreak: 0, bestStreak: 0, guessDistribution: [0, 0, 0, 0, 0, 0], lastCompletedPuzzleId: null };
const allCorrect: LetterMark[] = ["correct", "correct", "correct", "correct", "correct"];

describe("recordCompletedGame", () => {
  it("records a completion once and updates its distribution", () => {
    const session = { ...createSession("2026-10-20"), status: "won" as const, guesses: [{ word: "PLUMA", marks: allCorrect }] };
    const updated = recordCompletedGame(emptyStats, session);
    expect(updated.played).toBe(1);
    expect(updated.guessDistribution[0]).toBe(1);
    expect(recordCompletedGame(updated, session)).toBe(updated);
    expect(winRate(updated)).toBe(100);
  });

  it("continues a streak only on consecutive UTC puzzle days", () => {
    const first = recordCompletedGame(emptyStats, { ...createSession("2026-10-19"), status: "won", guesses: [{ word: "PLUMA", marks: allCorrect }] });
    const next = recordCompletedGame(first, { ...createSession("2026-10-20"), status: "won", guesses: [{ word: "PLUMA", marks: allCorrect }] });
    const afterGap = recordCompletedGame(next, { ...createSession("2026-10-22"), status: "won", guesses: [{ word: "PLUMA", marks: allCorrect }] });
    expect(next.currentStreak).toBe(2);
    expect(afterGap.currentStreak).toBe(1);
    expect(afterGap.bestStreak).toBe(2);
  });

  it("does not change statistics for a session still in progress", () => {
    expect(recordCompletedGame(emptyStats, createSession("2026-10-20"))).toBe(emptyStats);
  });

  it("records losses once and resets the current streak without losing the best", () => {
    const winningStats = recordCompletedGame(emptyStats, {
      ...createSession("2026-10-19"),
      status: "won",
      guesses: [{ word: "PLUMA", marks: allCorrect }],
    });
    const loss = {
      ...createSession("2026-10-20"),
      status: "lost" as const,
      guesses: ["PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO"].map((word) => ({
        word,
        marks: allCorrect,
      })),
    };

    const updated = recordCompletedGame({ ...winningStats, currentStreak: 1, bestStreak: 1 }, loss);

    expect(updated).toMatchObject({ played: 2, wins: 1, currentStreak: 0, bestStreak: 1 });
    expect(updated.guessDistribution).toEqual([1, 0, 0, 0, 0, 0]);
    expect(recordCompletedGame(updated, loss)).toBe(updated);
    expect(winRate(updated)).toBe(50);
  });

  it("returns a zero win rate when no games have been played", () => {
    expect(winRate(emptyStats)).toBe(0);
  });
});
