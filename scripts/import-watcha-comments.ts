import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import type { QuizItem } from "../src/features/quiz/quiz-types";

type InputFormat = "json" | "html";
type WatchaNormalizer = typeof import("./normalize-watcha-comments");

interface ImportOptions {
  source: string;
  inputPath: string;
  outputPath?: string;
  inputFormat: InputFormat;
  label?: string;
  description?: string;
  includeSpoilers?: boolean;
  minCommentLength?: number;
  updateManifest: boolean;
}

interface WatchaCommentsSource {
  userId: string;
  commentsUrl: string;
  datasetId: string;
  outputPath: string;
  defaultLabel: string;
  defaultDescription: string;
}

interface DatasetManifestEntry {
  id: string;
  label: string;
  description: string;
  itemCount: number;
  path: string;
}

const manifestPath = "src/data/manifest.json";

export function resolveWatchaCommentsSource(source: string): WatchaCommentsSource {
  const trimmed = source.trim();
  if (!trimmed) throw new Error("Watcha Pedia user id or comments URL is required.");

  const userId = isLikelyUserId(trimmed) ? trimmed : extractWatchaUserId(trimmed);
  const datasetId = `watcha-${slugify(userId) || "comments"}`;
  const commentsUrl = `https://pedia.watcha.com/ko/users/${encodeURIComponent(userId)}/comments`;

  return {
    userId,
    commentsUrl,
    datasetId,
    outputPath: `src/data/users/${datasetId}.json`,
    defaultLabel: `Watcha comments (${userId})`,
    defaultDescription: `Watcha Pedia comments imported from ${commentsUrl}`,
  };
}

export async function importWatchaComments(options: ImportOptions): Promise<{ itemCount: number; outputPath: string }> {
  const source = resolveWatchaCommentsSource(options.source);
  const outputPath = options.outputPath ?? source.outputPath;
  const { normalizeWatchaComments, parseDatasetInput } = await loadNormalizer();
  const rawInput = await readFile(options.inputPath, "utf8");
  const parsedInput = parseDatasetInput(rawInput, options.inputFormat);
  const items = getImportedQuizItems(parsedInput);
  const normalizedItems =
    items ??
    normalizeWatchaComments(parsedInput, {
      includeSpoilers: options.includeSpoilers,
      minCommentLength: options.minCommentLength,
    });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(normalizedItems, null, 2)}\n`, "utf8");

  if (options.updateManifest) {
    await upsertManifestEntry({
      id: getDatasetIdFromOutputPath(outputPath) || source.datasetId,
      label: options.label ?? source.defaultLabel,
      description: options.description ?? source.defaultDescription,
      itemCount: normalizedItems.length,
      path: normalizePathForManifest(outputPath),
    });
  }

  return { itemCount: normalizedItems.length, outputPath };
}

function getImportedQuizItems(input: unknown): QuizItem[] | null {
  const candidate = Array.isArray(input) ? input : isObject(input) && Array.isArray(input.items) ? input.items : null;
  if (!candidate) return null;
  if (!candidate.every(isQuizItem)) return null;

  return dedupeMovieItems(candidate);
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

function dedupeMovieItems(items: QuizItem[]): QuizItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!isMovieQuizItem(item)) return false;

    const key = `${item.id}:${item.answerTitle}:${item.comment}`;
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function isMovieQuizItem(item: QuizItem): boolean {
  return item.id.startsWith("watcha-m");
}

async function loadNormalizer(): Promise<WatchaNormalizer> {
  return import(`./normalize-watcha-comments.${"ts"}`) as Promise<WatchaNormalizer>;
}

async function upsertManifestEntry(entry: DatasetManifestEntry): Promise<void> {
  const currentManifest = await readManifest();
  const nextManifest = currentManifest.filter((item) => item.id !== entry.id && item.path !== entry.path);
  nextManifest.push(entry);

  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");
}

async function readManifest(): Promise<DatasetManifestEntry[]> {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isManifestEntry) : [];
  } catch {
    return [];
  }
}

function extractWatchaUserId(source: string): string {
  const url = toUrl(source);
  if (url.hostname !== "pedia.watcha.com") {
    throw new Error("Only pedia.watcha.com user profile or comments URLs are supported.");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const usersIndex = segments.indexOf("users");
  const userId = usersIndex === -1 ? "" : segments[usersIndex + 1] ?? "";

  if (!isLikelyUserId(userId)) {
    throw new Error("Could not find a Watcha Pedia user id in the source URL.");
  }

  return userId;
}

function toUrl(source: string): URL {
  try {
    return new URL(source);
  } catch {
    return new URL(`https://${source}`);
  }
}

function isLikelyUserId(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/u.test(value);
}

function getDatasetIdFromOutputPath(outputPath: string): string {
  const fileName = outputPath.replaceAll("\\", "/").split("/").pop() ?? "";
  return fileName.endsWith(".json") ? fileName.slice(0, -".json".length) : "";
}

function normalizePathForManifest(outputPath: string): string {
  const relativePath = outputPath.startsWith("src/") ? outputPath : relative(process.cwd(), outputPath);
  return relativePath.replaceAll("\\", "/");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 64);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isManifestEntry(value: unknown): value is DatasetManifestEntry {
  return (
    isObject(value) &&
    "id" in value &&
    typeof value.id === "string" &&
    "label" in value &&
    typeof value.label === "string" &&
    "path" in value &&
    typeof value.path === "string"
  );
}

function parseCliOptions(args: string[]): ImportOptions {
  let source = "";
  let inputPath = "";
  let outputPath: string | undefined;
  let inputFormat: InputFormat = "html";
  let label: string | undefined;
  let description: string | undefined;
  let includeSpoilers = false;
  let minCommentLength: number | undefined;
  let updateManifest = true;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--source" || arg === "--url" || arg === "--user") {
      source = args[index + 1] ?? "";
      index += 1;
      continue;
    }

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

    if (arg === "--input-format") {
      const value = args[index + 1];
      if (value === "json" || value === "html") inputFormat = value;
      index += 1;
      continue;
    }

    if (arg === "--label") {
      label = args[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg === "--description") {
      description = args[index + 1] ?? "";
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

    if (arg === "--no-manifest") {
      updateManifest = false;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!source || !inputPath) {
    printHelp();
    throw new Error("Both --source and --input are required.");
  }

  return { source, inputPath, outputPath, inputFormat, label, description, includeSpoilers, minCommentLength, updateManifest };
}

function printHelp() {
  console.log(`Usage:
  npm run import:watcha -- --source VRZv4O9DPqr6y --input data-raw/my-comments.html
  npm run import:watcha -- --source https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments --input data-raw/my-comments.json --input-format json

Options:
      --source, --url, --user <id|url>  Watcha Pedia user id, profile URL, or comments URL.
  -i, --input <path>                    Local rendered HTML or Watcha-like JSON file.
  -o, --output <path>                   Output QuizItem[] JSON path. Defaults to src/data/users/watcha-{userId}.json.
      --input-format <json|html>        Input format. Defaults to html.
      --label <label>                   Manifest label.
      --description <text>              Manifest description.
      --include-spoilers                Keep spoiler comments. Defaults to false.
      --min-comment-length <n>          Exclude comments shorter than n characters.
      --no-manifest                     Write JSON only and skip src/data/manifest.json update.

Before saving HTML, open the comments page in your browser and scroll until every comment is loaded.
This script does not reuse cookies, authorization headers, or HAR files.
`);
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const source = resolveWatchaCommentsSource(options.source);
  const result = await importWatchaComments(options);

  console.log(`Imported ${result.itemCount} quiz items from ${source.commentsUrl}`);
  console.log(`Wrote ${result.outputPath}`);
  if (options.updateManifest) console.log(`Updated ${manifestPath}`);
}

const isDirectRun = process.argv[1] ? fileURLToPath(import.meta.url) === process.argv[1] : false;

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
