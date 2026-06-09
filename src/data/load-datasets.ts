import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { QuizDataset, QuizItem } from "@/features/quiz/quiz-types";

interface DatasetManifestEntry {
  id: string;
  label: string;
  description?: string;
  itemCount?: number;
  path?: string;
}

interface DatasetItemParseResult {
  items: QuizItem[];
  invalidItemCount: number;
  validationMessages: string[];
}

const dataDirectory = join(process.cwd(), "src", "data", "users");
const manifestPath = join(process.cwd(), "src", "data", "manifest.json");
const maxValidationMessages = 3;

export async function loadQuizDatasets(): Promise<QuizDataset[]> {
  const [manifest, fileNames] = await Promise.all([readManifest(), readdir(dataDirectory)]);
  const jsonFileNames = fileNames.filter((fileName) => fileName.endsWith(".json"));
  const datasets = await Promise.all(jsonFileNames.map((fileName) => loadDataset(fileName, manifest)));

  return datasets.sort((left, right) => getManifestIndex(left.id, manifest) - getManifestIndex(right.id, manifest));
}

async function loadDataset(fileName: string, manifest: DatasetManifestEntry[]): Promise<QuizDataset> {
  const id = basename(fileName, ".json");
  const manifestEntry = findManifestEntry(id, fileName, manifest);
  const parsed = await readDatasetJson(fileName);
  const { items, invalidItemCount, validationMessages } = parseDatasetItems(parsed, fileName);

  return {
    id: manifestEntry?.id ?? id,
    label: manifestEntry?.label ?? id,
    description: manifestEntry?.description ?? "Local quiz dataset",
    items,
    invalidItemCount,
    validationMessages,
  };
}

export function parseDatasetItems(input: unknown, fileName = "dataset.json"): DatasetItemParseResult {
  if (input instanceof Error) {
    return {
      items: [],
      invalidItemCount: 0,
      validationMessages: [`${fileName}: ${input.message}`],
    };
  }

  if (!Array.isArray(input)) {
    return {
      items: [],
      invalidItemCount: 0,
      validationMessages: [`${fileName}: dataset file must contain a QuizItem[] array.`],
    };
  }

  const items: QuizItem[] = [];
  const validationMessages: string[] = [];

  input.forEach((value, index) => {
    const errors = getQuizItemErrors(value);

    if (errors.length === 0) {
      items.push(value as QuizItem);
      return;
    }

    if (validationMessages.length < maxValidationMessages) {
      validationMessages.push(`${fileName} item ${index + 1}: ${errors.join(", ")}`);
    }
  });

  const invalidItemCount = input.length - items.length;
  if (invalidItemCount > validationMessages.length) {
    validationMessages.push(`${fileName}: ${invalidItemCount - validationMessages.length} more invalid item(s) hidden.`);
  }

  return { items, invalidItemCount, validationMessages };
}

async function readDatasetJson(fileName: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(join(dataDirectory, fileName), "utf8")) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse dataset JSON.";
    return new Error(`not valid JSON. ${message}`);
  }
}

async function readManifest(): Promise<DatasetManifestEntry[]> {
  try {
    const parsed = JSON.parse(await readFile(manifestPath, "utf8")) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isManifestEntry) : [];
  } catch {
    return [];
  }
}

function findManifestEntry(id: string, fileName: string, manifest: DatasetManifestEntry[]): DatasetManifestEntry | undefined {
  return manifest.find((entry) => entry.id === id || entry.path?.replaceAll("\\", "/").endsWith(`/users/${fileName}`));
}

function getManifestIndex(id: string, manifest: DatasetManifestEntry[]): number {
  const index = manifest.findIndex((entry) => entry.id === id);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function isManifestEntry(value: unknown): value is DatasetManifestEntry {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "label" in value &&
    typeof value.label === "string"
  );
}

function getQuizItemErrors(value: unknown): string[] {
  if (typeof value !== "object" || value === null) return ["item must be an object"];

  const item = value as Record<string, unknown>;
  const errors: string[] = [];

  if (typeof item.id !== "string") errors.push("id must be a string");
  if (item.source !== "watcha" && item.source !== "manual") errors.push("source must be watcha or manual");
  if (typeof item.comment !== "string") errors.push("comment must be a string");
  if (typeof item.answerTitle !== "string") errors.push("answerTitle must be a string");
  if (!Array.isArray(item.aliases) || !item.aliases.every((alias) => typeof alias === "string")) {
    errors.push("aliases must be a string array");
  }
  if (typeof item.year !== "number" && item.year !== null) errors.push("year must be a number or null");
  if (typeof item.posterUrl !== "string" && item.posterUrl !== null) errors.push("posterUrl must be a string or null");
  if (!Array.isArray(item.directorNames) || !item.directorNames.every((directorName) => typeof directorName === "string")) {
    errors.push("directorNames must be a string array");
  }
  if (typeof item.ratingRaw !== "number" && item.ratingRaw !== null) errors.push("ratingRaw must be a number or null");
  if (typeof item.ratingStars !== "number" && item.ratingStars !== null) errors.push("ratingStars must be a number or null");
  if (typeof item.createdAt !== "string" && item.createdAt !== null) errors.push("createdAt must be a string or null");
  if (typeof item.spoiler !== "boolean") errors.push("spoiler must be a boolean");
  if (typeof item.improper !== "boolean") errors.push("improper must be a boolean");

  return errors;
}
