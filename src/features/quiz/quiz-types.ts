export interface QuizItem {
  id: string;
  source: "watcha" | "manual";
  comment: string;
  answerTitle: string;
  aliases: string[];
  year: number | null;
  posterUrl: string | null;
  directorNames: string[];
  ratingRaw: number | null;
  ratingStars: number | null;
  createdAt: string | null;
  spoiler: boolean;
  improper: boolean;
}

export interface QuizDataset {
  id: string;
  label: string;
  description: string;
  items: QuizItem[];
  invalidItemCount: number;
}

export type QuestionCount = 5 | 10 | 20 | "all";
export type Difficulty = "easy" | "normal" | "hard";

export interface QuizAttempt {
  item: QuizItem;
  userAnswer: string;
  correct: boolean;
  similarity: number;
  matchedTitle: string | null;
}

export interface QuizSession {
  items: QuizItem[];
  attempts: QuizAttempt[];
  currentIndex: number;
}
