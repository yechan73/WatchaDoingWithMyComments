import Image from "next/image";
import type { ReactNode } from "react";
import type { QuizItem } from "@/features/quiz/quiz-types";
import { formatRatingStars } from "@/lib/rating";

interface QuizCardProps {
  item: QuizItem;
  elapsedSeconds: number;
  revealed: boolean;
}

export function QuizCard({ item, elapsedSeconds, revealed }: QuizCardProps) {
  const showDetails = elapsedSeconds >= 10;
  const showInitials = elapsedSeconds >= 20;

  return (
    <section className="quiz-card" aria-label="문제 카드">
      <div className="quiz-card__face">
        {!revealed ? (
          <>
            <div className="quiz-card__quote-area">
              <p className="quiz-card__quote">{item.comment}</p>
            </div>
            <dl className="quiz-card__hints" aria-label="힌트">
              <HintItem label="내 평점" visible={showDetails} placeholder="? / 5.0">
                {formatRatingStars(item.ratingStars)}
              </HintItem>
              <HintItem label="감독" visible={showDetails}>
                {item.directorNames.join(", ") || "힌트 없음"}
              </HintItem>
              <HintItem label="개봉년도" visible={showDetails}>
                {item.year ?? "힌트 없음"}
              </HintItem>
              <HintItem label="제목 초성" visible={showInitials}>
                {getTitleInitials(item.answerTitle)}
              </HintItem>
            </dl>
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

function HintItem({ label, visible, placeholder = "?", children }: { label: string; visible: boolean; placeholder?: string; children: ReactNode }) {
  return (
    <div className={visible ? "quiz-card__hint quiz-card__hint--revealed" : "quiz-card__hint"}>
      <dt>{label}</dt>
      <dd>
        <span
          key={visible ? "revealed" : "locked"}
          className={visible ? "quiz-card__hint-value quiz-card__hint-value--revealed" : "quiz-card__hint-value quiz-card__hint-value--locked"}
        >
          {visible ? children : placeholder}
        </span>
      </dd>
    </div>
  );
}

function getTitleInitials(title: string): string {
  return Array.from(title)
    .map((char) => getCharacterInitial(char))
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
}

const hangulInitials = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

function getCharacterInitial(char: string): string {
  const code = char.charCodeAt(0);

  if (code >= 0xac00 && code <= 0xd7a3) {
    return hangulInitials[Math.floor((code - 0xac00) / 588)] ?? char;
  }

  if (/\s/u.test(char)) return " ";
  if (/[ㄱ-ㅎㅏ-ㅣ]/u.test(char)) return char;
  if (/[()[\]{}:;,.!?'"‘’“”·ㆍ~\-_/]/u.test(char)) return char;
  if (/[A-Za-z0-9]/u.test(char)) return "·";

  return char;
}
