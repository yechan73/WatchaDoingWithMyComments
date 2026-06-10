import Image from "next/image";
import type { QuizItem } from "@/features/quiz/quiz-types";
import { formatRatingStars } from "@/lib/rating";

interface QuizCardProps {
  item: QuizItem;
  elapsedSeconds: number;
  revealed: boolean;
}

export function QuizCard({ item, elapsedSeconds, revealed }: QuizCardProps) {
  const showRating = elapsedSeconds >= 10;
  const showDetails = elapsedSeconds >= 20;
  const hasHints = showRating || showDetails;

  return (
    <section className="quiz-card" aria-label="문제 카드">
      <div className="quiz-card__face">
        {!revealed ? (
          <>
            <p className="quiz-card__quote">“{item.comment}”</p>
            {hasHints ? (
              <dl className="quiz-card__hints">
                {showRating ? (
                  <div>
                    <dt>내 평점</dt>
                    <dd>{formatRatingStars(item.ratingStars)}</dd>
                  </div>
                ) : null}
                {showDetails ? (
                  <>
                    <div>
                      <dt>감독</dt>
                      <dd>{item.directorNames.join(", ") || "힌트 없음"}</dd>
                    </div>
                    <div>
                      <dt>개봉년도</dt>
                      <dd>{item.year ?? "힌트 없음"}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            ) : null}
          </>
        ) : (
          <div className="quiz-card__poster" aria-hidden="true">
            {item.posterUrl ? <Image src={item.posterUrl} alt="" fill sizes="16rem" unoptimized /> : <span>포스터 없음</span>}
          </div>
        )}
      </div>
    </section>
  );
}
