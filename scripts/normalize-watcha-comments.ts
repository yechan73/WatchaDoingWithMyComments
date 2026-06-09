import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import type { QuizItem } from "../src/features/quiz/quiz-types";
import type { WatchaRawComment } from "../src/types/watcha";

type InputFormat = "json" | "html";

interface NormalizeOptions {
  includeSpoilers?: boolean;
  minCommentLength?: number;
}

interface CliOptions extends NormalizeOptions {
  inputPath: string;
  outputPath: string;
  inputFormat: InputFormat;
}

type JsonObject = Record<string, unknown>;
type WatchaPoster = NonNullable<NonNullable<WatchaRawComment["content"]>["poster"]>;

export function parseDatasetInput(raw: string, inputFormat: InputFormat = "json"): unknown {
  if (inputFormat === "html") {
    return parseRenderedWatchaHtmlComments(raw);
  }

  const trimmed = raw.trimStart();

  if (trimmed.startsWith("<")) {
    throw new Error(
      "Input looks like HTML, not JSON. Copy the Network response body JSON, not the Elements panel markup or rendered page HTML.",
    );
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    throw new Error(`Input is not valid JSON. ${message}`);
  }
}

export function parseRenderedWatchaHtmlComments(raw: string): WatchaRawComment[] {
  const dom = new JSDOM(`<body>${raw}</body>`);
  const articles = Array.from(dom.window.document.querySelectorAll("article"));

  return articles.flatMap((article, index) => {
    const contentLink = article.querySelector('a[title][href*="/contents/"]');
    const commentLink = article.querySelector('a[href*="/comments/"]');
    const title = getText(contentLink?.getAttribute("title")) || getText(article.querySelector('[class*="_title_"]')?.textContent);
    const comment = getText(article.querySelector(".CommentText")?.textContent);

    if (!title || !comment) return [];

    const posterUrl = sanitizeUrl(contentLink?.querySelector("img")?.getAttribute("src"));
    const contentCode = extractLastPathSegment(contentLink?.getAttribute("href")) || `html-content-${index + 1}`;
    const commentCode = extractLastPathSegment(commentLink?.getAttribute("href")) || `html-comment-${index + 1}`;
    const year = extractYear(article.querySelector('[class*="_meta_"]')?.textContent);
    const ratingStars = parseNumber(article.querySelector('[class*="_rating_"] p')?.textContent);

    return [
      {
        code: commentCode,
        text: comment,
        content: {
          code: contentCode,
          title,
          year: year ?? undefined,
          poster: posterUrl ? { large: posterUrl } : undefined,
          director_names: [],
        },
        user_content_action: {
          rating: ratingStars === null ? undefined : ratingStars * 2,
        },
        spoiler: false,
        improper: false,
      },
    ];
  });
}

export function normalizeWatchaComments(input: unknown, options: NormalizeOptions = {}): QuizItem[] {
  const rawComments = extractRawComments(input);
  const seen = new Set<string>();
  const items: QuizItem[] = [];

  rawComments.forEach((rawComment, index) => {
    const item = normalizeRawComment(rawComment, index);

    if (!item) return;
    if (!options.includeSpoilers && item.spoiler) return;
    if (item.improper) return;
    if (options.minCommentLength && item.comment.length < options.minCommentLength) return;

    const dedupeKey = `${rawComment.content?.code ?? rawComment.code ?? ""}:${item.comment}`;
    if (seen.has(dedupeKey)) return;

    seen.add(dedupeKey);
    items.push(item);
  });

  return items;
}

export function extractRawComments(input: unknown): WatchaRawComment[] {
  if (Array.isArray(input)) {
    return input.flatMap((entry) => {
      if (isRawComment(entry)) return [entry];
      return extractRawComments(entry);
    });
  }

  if (!isObject(input)) return [];

  const result = input.result;
  if (isObject(result) && Array.isArray(result.result)) {
    return result.result.filter(isRawComment);
  }

  if (Array.isArray(result)) {
    return result.filter(isRawComment);
  }

  return [];
}

export function normalizeRawComment(rawComment: WatchaRawComment, index: number): QuizItem | null {
  const comment = normalizeText(rawComment.text);
  const title = normalizeText(rawComment.content?.title);

  if (!comment || !title) return null;

  const contentCode = normalizeText(rawComment.content?.code);
  const commentCode = normalizeText(rawComment.code);
  const ratingRaw = typeof rawComment.user_content_action?.rating === "number" ? rawComment.user_content_action.rating : null;

  return {
    id: createQuizItemId(contentCode || commentCode || title, comment, index),
    source: "watcha",
    comment,
    answerTitle: title,
    aliases: [],
    year: typeof rawComment.content?.year === "number" ? rawComment.content.year : null,
    posterUrl: selectPosterUrl(rawComment.content?.poster),
    directorNames: Array.isArray(rawComment.content?.director_names) ? rawComment.content.director_names.filter(isNonEmptyString) : [],
    ratingRaw,
    ratingStars: ratingRaw === null ? null : ratingRaw / 2,
    createdAt: normalizeText(rawComment.created_at) || null,
    spoiler: rawComment.spoiler === true,
    improper: rawComment.improper === true,
  };
}

function selectPosterUrl(poster: WatchaPoster | undefined): string | null {
  if (!isObject(poster)) return null;

  return (
    normalizeText(poster.large) ||
    normalizeText(poster.medium) ||
    normalizeText(poster.xlarge) ||
    normalizeText(poster.hd) ||
    normalizeText(poster.small) ||
    null
  );
}

function createQuizItemId(base: string, comment: string, index: number): string {
  return `watcha-${slugify(base) || "item"}-${hashText(`${base}:${comment}:${index}`)}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
}

function hashText(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "";
}

function extractLastPathSegment(value: unknown): string {
  if (typeof value !== "string") return "";

  const cleanPath = value.split("?")[0].replace(/\/$/u, "");
  return cleanPath.split("/").pop() ?? "";
}

function extractYear(value: unknown): number | null {
  if (typeof value !== "string") return null;

  const match = value.match(/\b(19|20)\d{2}\b/u);
  return match ? Number(match[0]) : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;

  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isRawComment(value: unknown): value is WatchaRawComment {
  return isObject(value) && ("text" in value || "content" in value);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCliOptions(args: string[]): CliOptions {
  let inputPath = "";
  let outputPath = "";
  let inputFormat: InputFormat = "json";
  let includeSpoilers = false;
  let minCommentLength: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--input" || arg === "-i") {
      inputPath = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      outputPath = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--include-spoilers") {
      includeSpoilers = true;
      continue;
    }

    if (arg === "--input-format") {
      const value = args[index + 1];
      if (value === "json" || value === "html") {
        inputFormat = value;
      }
      index += 1;
      continue;
    }

    if (arg === "--min-comment-length") {
      const parsed = Number(args[index + 1]);
      minCommentLength = Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!inputPath || !outputPath) {
    printHelp();
    throw new Error("Both --input and --output are required.");
  }

  return { inputPath, outputPath, inputFormat, includeSpoilers, minCommentLength };
}

function printHelp() {
  console.log(`Usage:
  node --experimental-strip-types scripts/normalize-watcha-comments.ts --input data-raw/comments.json --output src/data/users/my-comments.json

Options:
  -i, --input <path>             Local Watcha-like JSON file to read.
  -o, --output <path>            Normalized QuizItem[] JSON file to write.
      --input-format <json|html> Input format. Defaults to json.
      --include-spoilers         Keep spoiler comments. Defaults to false.
      --min-comment-length <n>   Exclude comments shorter than n characters.
`);
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const input = parseDatasetInput(await readFile(options.inputPath, "utf8"), options.inputFormat);
  const items = normalizeWatchaComments(input, options);

  await mkdir(dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, `${JSON.stringify(items, null, 2)}\n`, "utf8");
  console.log(`Wrote ${items.length} quiz items to ${options.outputPath}`);
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
