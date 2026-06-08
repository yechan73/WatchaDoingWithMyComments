import { describe, expect, it } from "vitest";
import { matchAnswer, isCorrectAnswer } from "@/features/quiz/answer-matcher";
import { normalizeTitle } from "@/lib/normalize-title";

describe("normalizeTitle", () => {
  it("trims, removes whitespace, and normalizes punctuation", () => {
    expect(normalizeTitle(" 스파이더맨: 노 웨이 홈 ")).toBe("스파이더맨노웨이홈");
  });

  it("removes bracketed suffixes", () => {
    expect(normalizeTitle("레베카 (2020)")).toBe("레베카");
  });
});

describe("answer matching", () => {
  it("matches exact Korean titles", () => {
    expect(isCorrectAnswer(" 레베카 ", "레베카")).toBe(true);
  });

  it("matches titles after spacing normalization", () => {
    expect(isCorrectAnswer("비틀쥬스비틀쥬스", "비틀쥬스 비틀쥬스")).toBe(true);
  });

  it("matches aliases", () => {
    expect(isCorrectAnswer("비틀주스 비틀주스", "비틀쥬스 비틀쥬스", ["비틀주스 비틀주스"])).toBe(true);
  });

  it("treats a close title variant as correct", () => {
    const result = matchAnswer("스파이더맨 노웨이홈", "스파이더맨: 노 웨이 홈");
    expect(result.status).toBe("correct");
  });

  it("rejects unrelated titles", () => {
    expect(isCorrectAnswer("오펜하이머", "레베카")).toBe(false);
  });
});
