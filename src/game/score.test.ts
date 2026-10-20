import { describe, expect, it } from "vitest";
import { scoreGuess } from "./score";

describe("scoreGuess", () => {
  it("marks exact and misplaced letters", () => {
    expect(scoreGuess("PLUMA", "PALCO")).toEqual(["correct", "present", "present", "absent", "absent"]);
  });

  it("does not award duplicate letters more times than they occur", () => {
    expect(scoreGuess("ERROO", "OOOOO")).toEqual(["absent", "absent", "absent", "correct", "correct"]);
  });
});
