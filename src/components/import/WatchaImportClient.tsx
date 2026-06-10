"use client";

import { Clipboard, Download, FileJson, Play, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QuizGame } from "@/components/quiz/QuizGame";
import type { QuizDataset, QuizItem } from "@/features/quiz/quiz-types";

interface WatchaImportClientProps {
  basePath: string;
}

export function WatchaImportClient({ basePath }: WatchaImportClientProps) {
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
  const [helperScript, setHelperScript] = useState("");
  const [helperStatus, setHelperStatus] = useState("");
  const [dataset, setDataset] = useState<QuizDataset | null>(null);
  const [importStatus, setImportStatus] = useState("");

  const helperUrl = useMemo(() => {
    if (!origin) return "";
    return `${origin}${basePath}/watcha-export-helper.js`;
  }, [basePath, origin]);

  const bookmarklet = useMemo(() => {
    if (!helperUrl) return "";
    return `javascript:(()=>{const s=document.createElement('script');s.src='${helperUrl}?t='+Date.now();document.body.appendChild(s)})()`;
  }, [helperUrl]);

  useEffect(() => {
    if (!helperUrl) return;

    fetch(helperUrl)
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("helper load failed"))))
      .then(setHelperScript)
      .catch(() => setHelperStatus("헬퍼 스크립트를 불러오지 못했습니다."));
  }, [helperUrl]);

  async function copyText(value: string, successMessage: string) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setHelperStatus(successMessage);
  }

  async function loadJsonFile(file: File | null) {
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const items = extractQuizItems(parsed);

      if (items.length === 0) {
        setImportStatus("플레이 가능한 코멘트가 없습니다.");
        setDataset(null);
        return;
      }

      setDataset({
        id: "imported-watcha-comments",
        label: file.name.replace(/\.json$/iu, "") || "Imported Watcha comments",
        description: "브라우저 헬퍼로 불러온 Watcha Pedia 코멘트",
        items,
        invalidItemCount: 0,
        validationMessages: [],
      });
      setImportStatus(`${items.length}개 코멘트를 불러왔습니다.`);
    } catch {
      setImportStatus("JSON 파일을 읽지 못했습니다.");
      setDataset(null);
    }
  }

  if (dataset) {
    return <QuizGame datasets={[dataset]} />;
  }

  return (
    <main className="import-screen">
      <section className="import-panel" aria-labelledby="import-title">
        <p className="eyebrow">Watcha Import</p>
        <h1 id="import-title">코멘트 불러오기</h1>

        <div className="import-actions" aria-label="Watcha helper actions">
          <button className="primary-action" type="button" onClick={() => copyText(bookmarklet, "북마클릿을 복사했습니다.")}>
            <Clipboard size={18} /> 북마클릿 복사
          </button>
          <button className="home-action" type="button" onClick={() => copyText(helperScript, "헬퍼 스크립트를 복사했습니다.")}>
            <FileJson size={18} /> 콘솔 스크립트 복사
          </button>
          <a className="import-link" href={helperUrl} download="watcha-export-helper.js">
            <Download size={18} /> 헬퍼 파일
          </a>
        </div>

        {helperStatus ? <p className="setup-panel__notice">{helperStatus}</p> : null}

        <ol className="import-steps">
          <li>Watcha Pedia에 로그인한 뒤 내 코멘트 페이지를 엽니다.</li>
          <li>북마클릿을 실행하거나 개발자 도구 콘솔에서 스크립트를 실행합니다.</li>
          <li>다운로드된 JSON을 아래에 업로드합니다.</li>
        </ol>

        <label className="import-dropzone">
          <Upload size={20} />
          <span>JSON 업로드</span>
          <input type="file" accept="application/json,.json" onChange={(event) => void loadJsonFile(event.target.files?.[0] ?? null)} />
        </label>

        {importStatus ? <p className="setup-panel__notice">{importStatus}</p> : null}

        <button className="primary-action" type="button" disabled={!dataset}>
          <Play size={18} /> 게임 시작
        </button>
      </section>
    </main>
  );
}

function extractQuizItems(input: unknown): QuizItem[] {
  const candidate = Array.isArray(input) ? input : isObject(input) && Array.isArray(input.items) ? input.items : [];
  return candidate.filter(isQuizItem);
}

function isQuizItem(value: unknown): value is QuizItem {
  if (!isObject(value)) return false;

  return (
    typeof value.id === "string" &&
    value.source === "watcha" &&
    typeof value.comment === "string" &&
    typeof value.answerTitle === "string" &&
    Array.isArray(value.aliases) &&
    (typeof value.year === "number" || value.year === null) &&
    (typeof value.posterUrl === "string" || value.posterUrl === null) &&
    Array.isArray(value.directorNames) &&
    (typeof value.ratingRaw === "number" || value.ratingRaw === null) &&
    (typeof value.ratingStars === "number" || value.ratingStars === null) &&
    (typeof value.createdAt === "string" || value.createdAt === null) &&
    typeof value.spoiler === "boolean" &&
    typeof value.improper === "boolean"
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
