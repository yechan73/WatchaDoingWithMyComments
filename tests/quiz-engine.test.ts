import { describe, expect, it } from "vitest";
import { createQuizSession, resolveQuestionCount } from "@/features/quiz/quiz-engine";
import type { QuizItem } from "@/features/quiz/quiz-types";

const items: QuizItem[] = [
  makeItem("1", "첫 코멘트", "첫 영화"),
  makeItem("2", "둘째 코멘트", "둘째 영화"),
  makeItem("3", "셋째 코멘트", "셋째 영화"),
  makeItem("4", "넷째 코멘트", "넷째 영화"),
  makeItem("5", "다섯째 코멘트", "다섯째 영화"),
  makeItem("6", "여섯째 코멘트", "여섯째 영화"),
];

describe("resolveQuestionCount", () => {
  it("caps requested count to available items", () => {
    expect(resolveQuestionCount(10, 6)).toBe(6);
  });

  it("returns all items for all", () => {
    expect(resolveQuestionCount("all", 6)).toBe(6);
  });
});

describe("createQuizSession", () => {
  it("creates a playable session with requested count", () => {
    const session = createQuizSession(items, 5, () => 0.5);
    expect(session.items).toHaveLength(5);
    expect(session.currentIndex).toBe(0);
    expect(session.attempts).toEqual([]);
  });

  it("filters invalid quiz items", () => {
    const session = createQuizSession([...items, makeItem("bad", "", "")], "all", () => 0.5);
    expect(session.items).toHaveLength(items.length);
  });
});

function makeItem(id: string, comment: string, answerTitle: string): QuizItem {
  return {
    id,
    source: "manual",
    comment,
    answerTitle,
    aliases: [],
    year: null,
    posterUrl: null,
    directorNames: [],
    ratingRaw: null,
    ratingStars: null,
    createdAt: null,
    spoiler: false,
    improper: false,
  };
}
