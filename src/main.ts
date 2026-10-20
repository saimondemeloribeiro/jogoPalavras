import { createSession, MAX_GUESSES, submitGuess, type GameSession } from "./game/session";
import { puzzleForDate, getAllowedGuesses } from "./puzzles/catalog";
import { recordCompletedGame, winRate, type PlayerStats } from "./stats/aggregate";
import { emptyStats, loadState, saveState } from "./storage/repository";

type AppState = { session: GameSession; stats: PlayerStats };

const puzzle = puzzleForDate();
const loadResult = loadState(puzzle.id);
const restored = loadResult.state;
let persistenceBlocked = loadResult.error !== null;
const state: AppState = {
  session: restored?.session ?? createSession(puzzle.id),
  stats: restored?.stats ?? emptyStats(),
};
const board = document.querySelector<HTMLOListElement>("#letter-board")!;
const feedback = document.querySelector<HTMLParagraphElement>("#letter-feedback")!;
const guessInput = document.querySelector<HTMLInputElement>("#guess-input")!;
const submitButton = document.querySelector<HTMLButtonElement>("#guess-form button")!;
const toast = document.querySelector<HTMLDivElement>("#toast")!;
let toastTimer = 0;

function showToast(message: string): void {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2800);
}

function persist(): boolean {
  return !persistenceBlocked && saveState(state);
}

function renderBoard(): void {
  board.replaceChildren();
  for (let rowIndex = 0; rowIndex < MAX_GUESSES; rowIndex += 1) {
    const row = document.createElement("li");
    row.className = "letter-row";
    const attempt = state.session.guesses[rowIndex];
    if (attempt) {
      const descriptions = { correct: "letra correta, na posição correta", present: "letra presente em outra posição", absent: "letra ausente" };
      const spokenRow = document.createElement("span");
      spokenRow.className = "hidden-label";
      spokenRow.textContent = `Tentativa ${rowIndex + 1}: ${[...attempt.word].map((letter, index) => `${letter}, ${descriptions[attempt.marks[index]]}`).join("; ")}`;
      row.append(spokenRow);
    }
    for (let column = 0; column < 5; column += 1) {
      const tile = document.createElement("span");
      const letter = attempt?.word[column] ?? "";
      const mark = attempt?.marks[column];
      tile.className = "letter-tile";
      if (mark) tile.dataset.state = mark;
      tile.textContent = letter;
      tile.setAttribute("aria-hidden", "true");
      row.append(tile);
    }
    board.append(row);
  }
}

function renderStats(): void {
  document.querySelector("#stat-played")!.textContent = String(state.stats.played);
  document.querySelector("#stat-wins")!.textContent = `${winRate(state.stats)}%`;
  document.querySelector("#stat-streak")!.textContent = String(state.stats.currentStreak);
  document.querySelector("#stat-best-streak")!.textContent = String(state.stats.bestStreak);
  const distribution = document.querySelector<HTMLOListElement>("#guess-distribution")!;
  distribution.replaceChildren();
  state.stats.guessDistribution.forEach((count, index) => {
    const item = document.createElement("li");
    const total = document.createElement("strong");
    total.textContent = String(count);
    item.append(total, document.createTextNode(String(index + 1)));
    distribution.append(item);
  });
}

function renderStatus(message?: string): void {
  const attemptsLeft = MAX_GUESSES - state.session.guesses.length;
  const lastGuess = state.session.guesses.at(-1);
  const hints = lastGuess ? ` Pistas atualizadas; ${attemptsLeft} ${attemptsLeft === 1 ? "tentativa restante" : "tentativas restantes"}.` : " Digite uma palavra para começar.";
  feedback.textContent = message ?? (state.session.status === "won"
    ? `Você encontrou ${puzzle.displayAnswer} em ${state.session.guesses.length} ${state.session.guesses.length === 1 ? "tentativa" : "tentativas"}.`
    : state.session.status === "lost"
      ? `As tentativas acabaram. A palavra era ${puzzle.displayAnswer}.`
      : lastGuess ? hints.trim() : "Digite uma palavra de cinco letras para começar.");
  const finished = state.session.status !== "playing";
  guessInput.disabled = finished;
  submitButton.disabled = finished;
  guessInput.setAttribute("aria-label", finished ? "Desafio concluído" : "Sua palavra de cinco letras");
}

function render(): void {
  renderBoard();
  renderStats();
  renderStatus();
}

function updateDateLabels(): void {
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${puzzle.id}T00:00:00Z`));
  document.querySelector("#puzzle-date")!.textContent = formatted;
  document.querySelector("#challenge-label")!.textContent = `Desafio diário · ${formatted}`;
}

function finishSession(): void {
  state.stats = recordCompletedGame(state.stats, state.session);
}

document.querySelector<HTMLFormElement>("#guess-form")!.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = submitGuess(state.session, guessInput.value, puzzle.answer, getAllowedGuesses());
  if ("error" in result) {
    const messages = {
      invalid: "Digite uma palavra de cinco letras, usando apenas letras.",
      "not-allowed": "Essa palavra não está no vocabulário deste desafio.",
      duplicate: "Você já tentou essa palavra.",
      finished: "Este desafio já foi concluído.",
    };
    renderStatus(messages[result.error]);
    return;
  }

  state.session = result.session;
  guessInput.value = "";
  finishSession();
  const saved = persist();
  render();
  if (!saved) feedback.textContent += " Não foi possível salvar neste navegador.";
  if (state.session.status === "playing") guessInput.focus();
});

document.querySelector<HTMLButtonElement>("#reset-letters")!.addEventListener("click", () => {
  if (!window.confirm("Recomeçar este desafio e apagar as tentativas atuais? As estatísticas serão mantidas.")) return;
  state.session = createSession(puzzle.id);
  const saved = persist();
  render();
  if (!saved) feedback.textContent = "O reinício não pôde ser salvo; as tentativas podem voltar ao recarregar.";
  guessInput.focus();
});

document.querySelector<HTMLButtonElement>("#share-result")!.addEventListener("click", async () => {
  if (state.session.guesses.length === 0) {
    showToast("Faça pelo menos uma tentativa antes de compartilhar.");
    return;
  }
  const symbols = { correct: "🟩", present: "🟧", absent: "⬜" };
  const result = `Palavra\n${state.session.guesses.map(({ marks }) => marks.map((mark) => symbols[mark]).join("")).join("\n")}`;

  if (navigator.share) {
    try {
      await navigator.share({ text: result });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(result);
    } else {
      const temporary = document.createElement("textarea");
      temporary.value = result;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      const copied = document.execCommand("copy");
      temporary.remove();
      if (!copied) throw new Error("Clipboard unavailable");
    }
    showToast("Resultado sem spoiler copiado.");
  } catch {
    showToast("Não foi possível copiar. Verifique a permissão da área de transferência.");
  }
});

updateDateLabels();
render();
if (loadResult.error) {
  feedback.textContent = loadResult.error === "invalid"
    ? "Os dados salvos estão inválidos; não serão substituídos automaticamente. Limpe os dados deste site para começar novamente."
    : "O armazenamento local não está disponível; o progresso não será salvo neste navegador.";
}
window.setTimeout(() => window.location.reload(), Date.parse(`${puzzle.id}T00:00:00Z`) + 86_400_000 - Date.now());
