"use client";

import Image from "next/image";
import { Clock3, HelpCircle, Play, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AnswerInput } from "./AnswerInput";
import { AnswerReveal } from "./AnswerReveal";
import { QuizCard } from "./QuizCard";
import { ScoreBoard } from "./ScoreBoard";
import { matchAnswer, type AnswerMatchResult } from "@/features/quiz/answer-matcher";
import { createQuizSession } from "@/features/quiz/quiz-engine";
import type { Difficulty, QuestionCount, QuizAttempt, QuizDataset, QuizItem } from "@/features/quiz/quiz-types";

interface QuizGameProps {
  datasets: QuizDataset[];
}

const questionCountOptions: QuestionCount[] = [5, 10, 20, "all"];
const difficulties: Array<{ value: Difficulty; label: string }> = [
  { value: "easy", label: "쉬움" },
  { value: "normal", label: "보통" },
  { value: "hard", label: "어려움" },
];
const timeLimitOptions = [15, 30, 45, 0] as const;
const emptyItems: QuizItem[] = [];

export function QuizGame({ datasets }: QuizGameProps) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(datasets[0]?.id ?? "");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<(typeof timeLimitOptions)[number]>(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<AnswerMatchResult | null>(null);
  const [finished, setFinished] = useState(false);
  const [showDatasetHelp, setShowDatasetHelp] = useState(false);

  const selectedDataset = datasets.find((dataset) => dataset.id === selectedDatasetId) ?? datasets[0];
  const items = selectedDataset?.items ?? emptyItems;
  const currentItem = quizItems[currentIndex];
  const selectedCountLabel = questionCount === "all" ? "전체" : `${questionCount}문제`;
  const playableCount = useMemo(() => items.filter((item) => item.comment && item.answerTitle).length, [items]);
  const previewPosters = useMemo(() => items.filter((item) => item.posterUrl).slice(0, 6), [items]);

  useEffect(() => {
    if (!currentItem || lastResult || timeLimitSeconds === 0) return;

    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        const result = matchAnswer("", currentItem.answerTitle, currentItem.aliases);
        setTimeLeft(0);
        setLastResult(result);
        setAttempts((previous) => [
          ...previous,
          {
            item: currentItem,
            userAnswer: "",
            correct: false,
            similarity: result.similarity,
            matchedTitle: result.matchedTitle,
          },
        ]);
        return;
      }

      setTimeLeft((seconds) => seconds - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [currentItem, lastResult, timeLeft, timeLimitSeconds]);

  function selectDataset(datasetId: string) {
    setSelectedDatasetId(datasetId);
    setQuizItems([]);
    setAttempts([]);
    setCurrentIndex(0);
    setAnswer("");
    setLastResult(null);
    setFinished(false);
    setTimeLeft(timeLimitSeconds);
  }

  function startGame() {
    const session = createQuizSession(items, questionCount);
    setQuizItems(session.items);
    setAttempts([]);
    setCurrentIndex(0);
    setAnswer("");
    setLastResult(null);
    setFinished(false);
    setTimeLeft(timeLimitSeconds);
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
    setTimeLeft(timeLimitSeconds);
  }

  if (finished) {
    return <ScoreBoard attempts={attempts} onRetry={startGame} />;
  }

  if (!currentItem) {
    return (
      <main className="home-screen">
        <section className="setup-panel" aria-labelledby="app-title">
          <p className="eyebrow">
            {selectedDataset?.label ?? "No dataset"} · {playableCount} comments
          </p>
          <h1 id="app-title" className="app-title">
            <Image className="watcha-logo" src="/brand/watcha-logo.jpg" alt="WATCHA" width={320} height={180} priority />
            <span>Doing with My Comments</span>
          </h1>
          <p className="setup-panel__copy">{selectedDataset?.description ?? "내가 쓴 한줄평만 보고 영화를 맞춰보세요."}</p>
          {previewPosters.length > 0 ? (
            <div className="poster-preview" aria-hidden="true">
              {previewPosters.map((item) => (
                <div className="poster-preview__item" key={item.id}>
                  <Image src={item.posterUrl ?? ""} alt="" fill sizes="5rem" unoptimized />
                </div>
              ))}
            </div>
          ) : null}
          <div className="control-grid">
            <label>
              <span className="field-label">
                데이터셋
                <button
                  className="help-button"
                  type="button"
                  aria-label="데이터셋 추가 방법 보기"
                  aria-expanded={showDatasetHelp}
                  onClick={() => setShowDatasetHelp(true)}
                >
                  <HelpCircle size={16} />
                </button>
              </span>
              <select value={selectedDataset?.id ?? ""} onChange={(event) => selectDataset(event.target.value)}>
                {datasets.length > 0 ? (
                  datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.label}
                    </option>
                  ))
                ) : (
                  <option value="">No datasets</option>
                )}
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
            <label>
              제한시간
              <select
                value={timeLimitSeconds}
                onChange={(event) => setTimeLimitSeconds(Number(event.target.value) as (typeof timeLimitOptions)[number])}
              >
                {timeLimitOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 0 ? "없음" : `${option}초`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary-action" type="button" onClick={startGame} disabled={playableCount === 0}>
            <Play size={18} /> {selectedCountLabel} 시작
          </button>
          {selectedDataset?.invalidItemCount ? (
            <p className="setup-panel__notice">
              이 데이터셋에서 형식이 맞지 않는 항목 {selectedDataset.invalidItemCount}개를 제외했습니다.
            </p>
          ) : null}
          {selectedDataset?.validationMessages.length ? (
            <ul className="setup-panel__notice-list" aria-label="데이터셋 검증 메시지">
              {selectedDataset.validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : null}
          {playableCount === 0 ? (
            <p className="setup-panel__notice">플레이 가능한 항목이 없습니다. 데이터셋 JSON의 comment와 answerTitle을 확인해주세요.</p>
          ) : null}
        </section>
        {showDatasetHelp ? <DatasetHelpDialog onClose={() => setShowDatasetHelp(false)} /> : null}
      </main>
    );
  }

  return (
    <main className="quiz-screen">
      <div className="quiz-shell">
        <header className="quiz-header">
          <p className="eyebrow">{difficultyLabel(difficulty)}</p>
          <div className="quiz-header__status">
            {timeLimitSeconds > 0 ? (
              <span className={`timer-badge${timeLeft <= 5 && !lastResult ? " timer-badge--danger" : ""}`}>
                <Clock3 size={16} />
                {timeLeft}초
              </span>
            ) : null}
            <strong>
              {currentIndex + 1} / {quizItems.length}
            </strong>
          </div>
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

function DatasetHelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dataset-help-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-panel__header">
          <h2 id="dataset-help-title">데이터셋 추가 방법</h2>
          <button className="icon-button" type="button" aria-label="닫기" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <ol className="dataset-help-list">
          <li>브라우저에서 본인의 Watcha Pedia 댓글 페이지를 열고 개발자 도구의 Network 탭을 확인합니다.</li>
          <li>댓글 JSON 응답의 body만 복사해서 `data-raw/my-comments.json` 같은 로컬 파일로 저장합니다.</li>
          <li>쿠키, 인증 헤더, HAR 파일, 세션 정보는 저장하거나 커밋하지 않습니다.</li>
          <li>
            `npm run normalize:data -- --input data-raw/my-comments.json --output src/data/users/my-comments.json`를 실행합니다.
          </li>
          <li>dev server를 재시작하거나 앱을 다시 빌드하면 새 JSON이 데이터셋 드롭다운에 표시됩니다.</li>
        </ol>
        <p className="modal-panel__note">자세한 내용은 `docs/DATASET_GUIDE.md`에 있습니다.</p>
      </section>
    </div>
  );
}
