import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerMatchResult } from "@/features/quiz/answer-matcher";
import type { QuizItem } from "@/features/quiz/quiz-types";
import { formatRatingStars } from "@/lib/rating";

interface AnswerRevealProps {
  item: QuizItem;
  result: AnswerMatchResult;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function AnswerReveal({ item, result, onNext, isLastQuestion }: AnswerRevealProps) {
  const correct = result.status === "correct";

  return (
    <section className={`answer-reveal answer-reveal--${correct ? "correct" : "incorrect"}`}>
      <div className="answer-reveal__status">
        <span className="answer-reveal__status-icon">{correct ? <CheckCircle2 size={22} /> : <XCircle size={22} />}</span>
        <strong>{correct ? "정답" : result.status === "near" ? "거의 정답" : "오답"}</strong>
      </div>
      <h2>
        {item.answerTitle} {item.year ? <span>({item.year})</span> : null}
      </h2>
      <p>감독: {item.directorNames.join(", ") || "정보 없음"}</p>
      <p>내 평점: {formatRatingStars(item.ratingStars)}</p>
      <p className="answer-reveal__meta">유사도 {(result.similarity * 100).toFixed(0)}%</p>
      <button type="button" onClick={onNext}>
        {isLastQuestion ? "결과 보기" : "다음 문제"}
      </button>
    </section>
  );
}
