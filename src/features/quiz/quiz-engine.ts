import { shuffleItems } from "@/lib/shuffle";
import type { QuestionCount, QuizItem, QuizSession } from "./quiz-types";

export function resolveQuestionCount(count: QuestionCount, totalItems: number): number {
  return count === "all" ? totalItems : Math.min(count, totalItems);
}

export function createQuizSession(
  items: readonly QuizItem[],
  count: QuestionCount,
  random: () => number = Math.random,
): QuizSession {
  const playableItems = items.filter((item) => item.comment.trim() && item.answerTitle.trim());
  const resolvedCount = resolveQuestionCount(count, playableItems.length);

  return {
    items: shuffleItems(playableItems, random).slice(0, resolvedCount),
    attempts: [],
    currentIndex: 0,
  };
}
