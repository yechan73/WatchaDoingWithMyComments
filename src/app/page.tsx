import { QuizGame } from "@/components/quiz/QuizGame";
import { loadQuizDatasets } from "@/data/load-datasets";

export default async function Home() {
  const datasets = await loadQuizDatasets();

  return <QuizGame datasets={datasets} />;
}
