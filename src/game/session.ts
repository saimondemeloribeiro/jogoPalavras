import { isFiveLetterWord, normalizeWord } from "./normalize";
import { scoreGuess, type LetterMark } from "./score";

export const MAX_GUESSES = 6;

export type GuessResult = { word: string; marks: LetterMark[] };
export type SessionStatus = "playing" | "won" | "lost";
export type GameSession = {
  puzzleId: string;
  guesses: GuessResult[];
  status: SessionStatus;
};
export type GuessError = "invalid" | "not-allowed" | "duplicate" | "finished";
export type SubmitResult = { session: GameSession } | { error: GuessError };

export function createSession(puzzleId: string): GameSession {
  return { puzzleId, guesses: [], status: "playing" };
}

export function submitGuess(
  session: GameSession,
  guess: string,
  answer: string,
  allowedGuesses: ReadonlySet<string>,
): SubmitResult {
  if (session.status !== "playing") return { error: "finished" };

  const normalized = normalizeWord(guess.trim());
  if (!isFiveLetterWord(normalized)) return { error: "invalid" };
  if (!allowedGuesses.has(normalized)) return { error: "not-allowed" };
  if (session.guesses.some((item) => item.word === normalized)) return { error: "duplicate" };

  const guesses = [...session.guesses, { word: normalized, marks: scoreGuess(answer, normalized) }];
  const status = normalized === normalizeWord(answer)
    ? "won"
    : guesses.length >= MAX_GUESSES
      ? "lost"
      : "playing";

  return { session: { ...session, guesses, status } };
}
