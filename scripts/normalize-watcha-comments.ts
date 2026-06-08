import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { QuizItem } from "../src/features/quiz/quiz-types";
import type { WatchaRawComment } from "../src/types/watcha";

interface NormalizeOptions {
  includeSpoilers?: boolean;
  minCommentLength?: number;
}

interface CliOptions extends NormalizeOptions {
  inputPath: string;
  outputPath: string;
}

type JsonObject = Record<string, unknown>;
type WatchaPoster = NonNullable<NonNullable<WatchaRawComment["content"]>["poster"]>;

export function parseDatasetInput(raw: string): unknown {
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

  return { inputPath, outputPath, includeSpoilers, minCommentLength };
}

function printHelp() {
  console.log(`Usage:
  node --experimental-strip-types scripts/normalize-watcha-comments.ts --input data-raw/comments.json --output src/data/users/my-comments.json

Options:
  -i, --input <path>             Local Watcha-like JSON file to read.
  -o, --output <path>            Normalized QuizItem[] JSON file to write.
      --include-spoilers         Keep spoiler comments. Defaults to false.
      --min-comment-length <n>   Exclude comments shorter than n characters.
`);
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const input = parseDatasetInput(await readFile(options.inputPath, "utf8"));
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
