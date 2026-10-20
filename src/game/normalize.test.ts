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
});
