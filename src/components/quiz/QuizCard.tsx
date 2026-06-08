import Image from "next/image";
import type { Difficulty, QuizItem } from "@/features/quiz/quiz-types";
import { formatRatingStars } from "@/lib/rating";

interface QuizCardProps {
  item: QuizItem;
  difficulty: Difficulty;
  revealed: boolean;
}

export function QuizCard({ item, difficulty, revealed }: QuizCardProps) {
  const showYear = difficulty === "easy";
  const showDirector = difficulty !== "hard";

  return (
    <section className="quiz-card" aria-label="문제 카드">
      <div className="quiz-card__face">
        {!revealed ? (
          <>
            <p className="quiz-card__quote">“{item.comment}”</p>
            <dl className="quiz-card__hints">
              <div>
                <dt>내 평점</dt>
                <dd>{formatRatingStars(item.ratingStars)}</dd>
              </div>
              {showDirector ? (
                <div>
                  <dt>감독</dt>
                  <dd>{item.directorNames.join(", ") || "힌트 없음"}</dd>
                </div>
              ) : null}
              {showYear ? (
                <div>
                  <dt>개봉연도</dt>
                  <dd>{item.year ?? "힌트 없음"}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : (
          <div className="quiz-card__poster" aria-hidden="true">
            {item.posterUrl ? <Image src={item.posterUrl} alt="" fill sizes="16rem" unoptimized /> : <span>POSTER</span>}
          </div>
        )}
      </div>
    </section>
  );
}

