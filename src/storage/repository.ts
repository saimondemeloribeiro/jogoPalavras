import type { GameSession } from "../game/session";
import type { PlayerStats } from "../stats/aggregate";

const STORAGE_KEY = "jogoPalavras:v1";

type PersistedState = { session: GameSession | null; stats: PlayerStats };
export type LoadResult = { state: PersistedState | null; error: "invalid" | "unavailable" | null };

export function loadState(puzzleId: string): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { state: null, error: "unavailable" };
  }
  if (!raw) return { state: null, error: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { state: null, error: "invalid" };
  }
  if (!isPersistedState(parsed)) return { state: null, error: "invalid" };
  return { state: { ...parsed, session: parsed.session?.puzzleId === puzzleId ? parsed.session : null }, error: null };
}

export function saveState(state: PersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function emptyStats(): PlayerStats {
  return { played: 0, wins: 0, currentStreak: 0, bestStreak: 0, guessDistribution: [0, 0, 0, 0, 0, 0], lastCompletedPuzzleId: null };
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PersistedState>;
  if (!candidate.stats) return false;
  const stats = candidate.stats;
  const validStats = [stats.played, stats.wins, stats.currentStreak, stats.bestStreak].every(isNonNegativeInteger) &&
    Array.isArray(stats.guessDistribution) && stats.guessDistribution.length === 6 && stats.guessDistribution.every(isNonNegativeInteger) &&
    (stats.lastCompletedPuzzleId === null || isPuzzleId(stats.lastCompletedPuzzleId));
  if (!validStats) return false;
  if (candidate.session === null) return true;
  if (!candidate.session || !isPuzzleId(candidate.session.puzzleId) || !Array.isArray(candidate.session.guesses) || candidate.session.guesses.length > 6) return false;
  if (!(candidate.session.status === "playing" || candidate.session.status === "won" || candidate.session.status === "lost")) return false;
  if (candidate.session.status === "playing" && candidate.session.guesses.length >= 6) return false;
  if (candidate.session.status === "won" && candidate.session.guesses.length === 0) return false;
  if (candidate.session.status === "lost" && candidate.session.guesses.length !== 6) return false;
  return candidate.session.guesses.every((guess) => {
    if (!guess || typeof guess.word !== "string" || guess.word.length !== 5 || !Array.isArray(guess.marks) || guess.marks.length !== 5) return false;
    return guess.marks.every((mark) => mark === "correct" || mark === "present" || mark === "absent");
  });
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isPuzzleId(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
