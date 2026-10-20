import { normalizeWord } from "../game/normalize";

export type Puzzle = { id: string; answer: string; displayAnswer: string };

const answers = ["PLUMA", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO", "TIGRE", "CALDO", "TRAMA", "PRATO", "LIMÃO", "PRAIA", "MANGA", "PORTA", "BARCO", "CAMPO", "VENTO", "BRISA", "FAROL", "PONTE"];
const allowedWords = new Set([
  ...answers,
  "PALCO", "TRIGO", "SORTE", "PLANO", "NOITE", "PONTO", "LENTO", "SONHO", "TERRA", "FESTA",
  "LINHA", "PAPEL", "LIVRE", "CORPO", "FOLGA", "TURMA", "CANTO", "CHUVA", "LETRA", "FREIO",
].map(normalizeWord));

export function puzzleForDate(date = new Date()): Puzzle {
  const id = date.toISOString().slice(0, 10);
  const dayNumber = Math.floor(Date.parse(`${id}T00:00:00.000Z`) / 86_400_000);
  const displayAnswer = answers[((dayNumber % answers.length) + answers.length) % answers.length];
  return { id, answer: normalizeWord(displayAnswer), displayAnswer };
}

export function isAllowedGuess(guess: string): boolean {
  return allowedWords.has(normalizeWord(guess));
}

export function getAllowedGuesses(): ReadonlySet<string> {
  return allowedWords;
}
