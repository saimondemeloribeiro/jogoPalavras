import { describe, expect, it } from "vitest";
import { isFiveLetterWord, normalizeWord } from "./normalize";

describe("normalizeWord", () => {
  it("normalizes case and Brazilian Portuguese diacritics", () => {
    expect(normalizeWord("limão")).toBe("LIMAO");
  });

  it("counts accented letters as one letter", () => {
    expect(isFiveLetterWord("limão")).toBe(true);
    expect(isFiveLetterWord("livro1")).toBe(false);
  });

  it("normalizes uppercase and decomposed accents consistently", () => {
    expect(normalizeWord("AÇÃO")).toBe("ACAO");
    expect(normalizeWord("cafe\u0301")).toBe("CAFE");
  });

  it("rejects spaces, punctuation, and non-Latin scripts as five-letter words", () => {
    expect(isFiveLetterWord(" dois")).toBe(false);
    expect(isFiveLetterWord("a-bcd")).toBe(false);
    expect(isFiveLetterWord("漢字あいう")).toBe(false);
  });
});
