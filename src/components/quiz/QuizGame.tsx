"use client";

import { Play } from "lucide-react";
import { useMemo, useState } from "react";
import { AnswerInput } from "./AnswerInput";
import { AnswerReveal } from "./AnswerReveal";
import { QuizCard } from "./QuizCard";
import { ScoreBoard } from "./ScoreBoard";
import { matchAnswer, type AnswerMatchResult } from "@/features/quiz/answer-matcher";
import { createQuizSession } from "@/features/quiz/quiz-engine";
import type { Difficulty, QuestionCount, QuizAttempt, QuizItem } from "@/features/quiz/quiz-types";

interface QuizGameProps {
  items: QuizItem[];
}

const questionCountOptions: QuestionCount[] = [5, 10, 20, "all"];
const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: "easy", label: "쉬움" },
  { value: "normal", label: "보통" },
  { value: "hard", label: "어려움" },
];

export function QuizGame({ items }: QuizGameProps) {
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<AnswerMatchResult | null>(null);
  const [finished, setFinished] = useState(false);

  const currentItem = quizItems[currentIndex];
  const selectedCountLabel = questionCount === "all" ? "전체" : `${questionCount}문제`;
  const playableCount = useMemo(() => items.filter((item) => item.comment && item.answerTitle).length, [items]);

  function startGame() {
    const session = createQuizSession(items, questionCount);
    setQuizItems(session.items);
    setAttempts([]);
    setCurrentIndex(0);
    setAnswer("");
    setLastResult(null);
    setFinished(false);
  }

  function submitAnswer() {
    if (!currentItem || lastResult) return;

    const result = matchAnswer(answer, currentItem.answerTitle, currentItem.aliases);
    setLastResult(result);
    setAttempts((previous) => [
      ...previous,
      {
        item: currentItem,
        userAnswer: answer,
        correct: result.status === "correct",
        similarity: result.similarity,
        matchedTitle: result.matchedTitle,
      },
    ]);
  }

  function moveNext() {
    if (currentIndex >= quizItems.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
    setAnswer("");
    setLastResult(null);
  }

  if (finished) {
    return <ScoreBoard attempts={attempts} onRetry={startGame} />;
  }

  if (!currentItem) {
    return (
      <main className="home-screen">
        <section className="setup-panel" aria-labelledby="app-title">
          <p className="eyebrow">Sample dataset · {playableCount} comments</p>
          <h1 id="app-title">Watcha Doing with My Comments</h1>
          <p className="setup-panel__copy">내가 쓴 한줄평만 보고 영화를 맞춰보세요.</p>
          <div className="control-grid">
            <label>
              데이터셋
              <select value="sample" disabled>
                <option value="sample">Sample comments</option>
              </select>
            </label>
            <label>
              문제 수
              <select
                value={questionCount}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuestionCount(value === "all" ? "all" : (Number(value) as QuestionCount));
                }}
              >
                {questionCountOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "전체" : `${option}문제`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              난이도
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)}>
                {difficulties.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary-action" type="button" onClick={startGame} disabled={playableCount === 0}>
            <Play size={18} /> {selectedCountLabel} 시작
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-screen">
      <div className="quiz-shell">
        <header className="quiz-header">
          <p className="eyebrow">{difficultyLabel(difficulty)}</p>
          <strong>
            {currentIndex + 1} / {quizItems.length}
          </strong>
        </header>
        <QuizCard item={currentItem} difficulty={difficulty} revealed={Boolean(lastResult)} />
        <AnswerInput value={answer} disabled={Boolean(lastResult)} onChange={setAnswer} onSubmit={submitAnswer} />
        {lastResult ? (
          <AnswerReveal
            item={currentItem}
            result={lastResult}
            onNext={moveNext}
            isLastQuestion={currentIndex === quizItems.length - 1}
          />
        ) : null}
      </div>
    </main>
  );
}

function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === "easy") return "쉬움";
  if (difficulty === "hard") return "어려움";
  return "보통";
}
