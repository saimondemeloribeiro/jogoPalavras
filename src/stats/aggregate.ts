import type { GameSession } from "../game/session";

export type PlayerStats = {
  played: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  guessDistribution: number[];
  lastCompletedPuzzleId: string | null;
};

export function recordCompletedGame(stats: PlayerStats, session: GameSession): PlayerStats {
  if (session.status === "playing" || stats.lastCompletedPuzzleId === session.puzzleId) return stats;

  const won = session.status === "won";
  const guessDistribution = [...stats.guessDistribution];
  if (won) guessDistribution[session.guesses.length - 1] += 1;
  const currentPuzzleDay = Date.parse(`${session.puzzleId}T00:00:00.000Z`);
  const previousPuzzleDay = stats.lastCompletedPuzzleId
    ? Date.parse(`${stats.lastCompletedPuzzleId}T00:00:00.000Z`)
    : Number.NaN;
  const consecutiveDay = currentPuzzleDay - previousPuzzleDay === 86_400_000;
  const currentStreak = won ? (consecutiveDay ? stats.currentStreak + 1 : 1) : 0;

  return {
    played: stats.played + 1,
    wins: stats.wins + Number(won),
    currentStreak,
    bestStreak: Math.max(stats.bestStreak, currentStreak),
    guessDistribution,
    lastCompletedPuzzleId: session.puzzleId,
  };
}

export function winRate(stats: PlayerStats): number {
  return stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
}
