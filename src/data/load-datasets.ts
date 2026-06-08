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

const dataDirectory = join(process.cwd(), "src", "data", "users");
const manifestPath = join(process.cwd(), "src", "data", "manifest.json");

export async function loadQuizDatasets(): Promise<QuizDataset[]> {
  const [manifest, fileNames] = await Promise.all([readManifest(), readdir(dataDirectory)]);
  const jsonFileNames = fileNames.filter((fileName) => fileName.endsWith(".json"));
  const datasets = await Promise.all(jsonFileNames.map((fileName) => loadDataset(fileName, manifest)));

  return datasets.sort((left, right) => getManifestIndex(left.id, manifest) - getManifestIndex(right.id, manifest));
}

async function loadDataset(fileName: string, manifest: DatasetManifestEntry[]): Promise<QuizDataset> {
  const id = basename(fileName, ".json");
  const manifestEntry = findManifestEntry(id, fileName, manifest);
  const raw = await readFile(join(dataDirectory, fileName), "utf8");
  const parsed = JSON.parse(raw) as unknown;
  const rawItems = Array.isArray(parsed) ? parsed : [];
  const items = rawItems.filter(isQuizItem);

  return {
    id: manifestEntry?.id ?? id,
    label: manifestEntry?.label ?? id,
    description: manifestEntry?.description ?? "Local quiz dataset",
    items,
    invalidItemCount: rawItems.length - items.length,
  };
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

function isQuizItem(value: unknown): value is QuizItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    (item.source === "watcha" || item.source === "manual") &&
    typeof item.comment === "string" &&
    typeof item.answerTitle === "string" &&
    Array.isArray(item.aliases) &&
    item.aliases.every((alias) => typeof alias === "string") &&
    (typeof item.year === "number" || item.year === null) &&
    (typeof item.posterUrl === "string" || item.posterUrl === null) &&
    Array.isArray(item.directorNames) &&
    item.directorNames.every((directorName) => typeof directorName === "string") &&
    (typeof item.ratingRaw === "number" || item.ratingRaw === null) &&
    (typeof item.ratingStars === "number" || item.ratingStars === null) &&
    (typeof item.createdAt === "string" || item.createdAt === null) &&
    typeof item.spoiler === "boolean" &&
    typeof item.improper === "boolean"
  );
}
