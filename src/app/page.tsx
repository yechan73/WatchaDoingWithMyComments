import { QuizGame } from "@/components/quiz/QuizGame";
import sampleItems from "@/data/users/sample.json";
import type { QuizItem } from "@/features/quiz/quiz-types";

export default function Home() {
  return <QuizGame items={sampleItems as QuizItem[]} />;
}
