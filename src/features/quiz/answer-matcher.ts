import { normalizeTitle } from "@/lib/normalize-title";

export type AnswerStatus = "correct" | "near" | "incorrect";

export interface AnswerMatchResult {
  status: AnswerStatus;
  similarity: number;
  matchedTitle: string | null;
  normalizedInput: string;
}

export function calculateLevenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      );
    }

    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

export function calculateSimilarity(left: string, right: string): number {
  const normalizedLeft = normalizeTitle(left);
  const normalizedRight = normalizeTitle(right);
  const longestLength = Math.max(normalizedLeft.length, normalizedRight.length);

  if (longestLength === 0) return 1;

  const distance = calculateLevenshteinDistance(normalizedLeft, normalizedRight);
  return 1 - distance / longestLength;
}

export function matchAnswer(input: string, answerTitle: string, aliases: string[] = []): AnswerMatchResult {
  const normalizedInput = normalizeTitle(input);
  const candidates = [answerTitle, ...aliases].filter(Boolean);
  let bestMatch: AnswerMatchResult = {
    status: "incorrect",
    similarity: 0,
    matchedTitle: null,
    normalizedInput,
  };

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeTitle(candidate);
    const similarity = calculateSimilarity(input, candidate);

    if (normalizedInput === normalizedCandidate) {
      return { status: "correct", similarity: 1, matchedTitle: candidate, normalizedInput };
    }

    if (similarity > bestMatch.similarity) {
      bestMatch = {
        status: similarity >= 0.9 ? "correct" : similarity >= 0.8 ? "near" : "incorrect",
        similarity,
        matchedTitle: candidate,
        normalizedInput,
      };
    }
  }

  return bestMatch;
}

export function isCorrectAnswer(input: string, answerTitle: string, aliases: string[] = []): boolean {
  return matchAnswer(input, answerTitle, aliases).status === "correct";
}
