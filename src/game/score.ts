import { normalizeWord } from "./normalize";

export type LetterMark = "correct" | "present" | "absent";

export function scoreGuess(answer: string, guess: string): LetterMark[] {
  const normalizedAnswer = [...normalizeWord(answer)];
  const normalizedGuess = [...normalizeWord(guess)];
  const remaining = [...normalizedAnswer];
  const marks: LetterMark[] = normalizedGuess.map(() => "absent");

  normalizedGuess.forEach((letter, index) => {
    if (letter === normalizedAnswer[index]) {
      marks[index] = "correct";
      remaining[index] = "";
    }
  });

  normalizedGuess.forEach((letter, index) => {
    if (marks[index] === "correct") return;
    const matchIndex = remaining.indexOf(letter);
    if (matchIndex !== -1) {
      marks[index] = "present";
      remaining[matchIndex] = "";
    }
  });

  return marks;
}
