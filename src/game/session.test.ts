import { describe, expect, it } from "vitest";
import { createSession, submitGuess } from "./session";

const allowed = new Set(["PLUMA", "PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM", "MUNDO", "LIMAO"]);

describe("submitGuess", () => {
  it("does not consume a turn for invalid or repeated guesses", () => {
    const session = createSession("2026-10-20");
    expect(submitGuess(session, "abc", "PLUMA", allowed)).toEqual({ error: "invalid" });
    const first = submitGuess(session, "PALCO", "PLUMA", allowed);
    expect("session" in first && first.session.guesses).toHaveLength(1);
    if (!("session" in first)) throw new Error("Expected accepted guess");
    expect(submitGuess(first.session, "PALCO", "PLUMA", allowed)).toEqual({ error: "duplicate" });
  });

  it("rejects words outside the allowed vocabulary without changing the session", () => {
    const session = createSession("2026-10-20");
    expect(submitGuess(session, "CASAS", "PLUMA", allowed)).toEqual({ error: "not-allowed" });
    expect(session.guesses).toHaveLength(0);
    expect(session.status).toBe("playing");
  });

  it("trims input and accepts case and accents through normalization", () => {
    const result = submitGuess(createSession("2026-10-20"), " limão ", "LIMÃO", allowed);
    expect("session" in result && result.session.guesses[0]?.word).toBe("LIMAO");
    expect("session" in result && result.session.status).toBe("won");
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
    expect(submitGuess(session, "PLUMA", "PLUMA", allowed)).toEqual({ error: "finished" });
  });

  it("allows a correct answer on the final attempt", () => {
    let session = createSession("2026-10-20");
    for (const guess of ["PALCO", "LIVRO", "PEDRA", "FOLHA", "NUVEM"]) {
      const result = submitGuess(session, guess, "PLUMA", allowed);
      if ("session" in result) session = result.session;
    }

    const finalGuess = submitGuess(session, "PLUMA", "PLUMA", allowed);
    expect("session" in finalGuess && finalGuess.session.status).toBe("won");
    expect("session" in finalGuess && finalGuess.session.guesses).toHaveLength(6);
  });
});
