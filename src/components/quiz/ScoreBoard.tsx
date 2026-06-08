import { RotateCcw } from "lucide-react";
import type { QuizAttempt } from "@/features/quiz/quiz-types";

interface ScoreBoardProps {
  attempts: QuizAttempt[];
  onRetry: () => void;
}

export function ScoreBoard({ attempts, onRetry }: ScoreBoardProps) {
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const accuracy = attempts.length === 0 ? 0 : Math.round((correctCount / attempts.length) * 100);
  const misses = attempts.filter((attempt) => !attempt.correct);

  return (
    <main className="result-screen">
      <section className="result-panel">
        <p className="eyebrow">결과</p>
        <h1>
          {attempts.length}문제 중 {correctCount}개 정답
        </h1>
        <p className="result-panel__accuracy">정답률 {accuracy}%</p>
        {misses.length > 0 ? (
          <div className="miss-list">
            <h2>틀린 문제</h2>
            <ul>
              {misses.map((attempt) => (
                <li key={attempt.item.id}>
                  <span>“{attempt.item.comment}”</span>
                  <strong>{attempt.item.answerTitle}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button type="button" onClick={onRetry}>
          <RotateCcw size={18} /> 다시 하기
        </button>
      </section>
    </main>
  );
}
