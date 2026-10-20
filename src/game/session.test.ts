import { describe, expect, it } from "vitest";
import { createSession, submitGuess } from "./session";

const allowed = new Set(["PLUMA", "PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO"]);

describe("submitGuess", () => {
  it("does not consume a turn for invalid or repeated guesses", () => {
    const session = createSession("2026-10-20");
    expect(submitGuess(session, "abc", "PLUMA", allowed)).toEqual({ error: "invalid" });
    const first = submitGuess(session, "PALCO", "PLUMA", allowed);
    expect("session" in first && first.session.guesses).toHaveLength(1);
    if (!("session" in first)) throw new Error("Expected accepted guess");
    expect(submitGuess(first.session, "PALCO", "PLUMA", allowed)).toEqual({ error: "duplicate" });
  });

  it("ends on a correct guess and rejects further input", () => {
    const result = submitGuess(createSession("2026-10-20"), "PLUMA", "PLUMA", allowed);
    expect("session" in result && result.session.status).toBe("won");
    if (!("session" in result)) throw new Error("Expected accepted guess");
    expect(submitGuess(result.session, "LIVRO", "PLUMA", allowed)).toEqual({ error: "finished" });
  });

  it("loses after six accepted guesses", () => {
    let session = createSession("2026-10-20");
    const guesses = ["PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO"];
    for (const guess of guesses) {
      const result = submitGuess(session, guess, "PLUMA", allowed);
      if ("session" in result) session = result.session;
    }
    expect(session.status).toBe("lost");
    expect(session.guesses).toHaveLength(6);
  });
});
