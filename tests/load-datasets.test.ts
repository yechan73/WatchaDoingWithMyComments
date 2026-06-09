import { describe, expect, it } from "vitest";
import { parseDatasetItems } from "@/data/load-datasets";
import type { QuizItem } from "@/features/quiz/quiz-types";

const validItem: QuizItem = {
  id: "valid-item",
  source: "manual",
  comment: "A quiet comment",
  answerTitle: "A Quiet Film",
  aliases: [],
  year: 2026,
  posterUrl: null,
  directorNames: ["Director"],
  ratingRaw: 8,
  ratingStars: 4,
  createdAt: null,
  spoiler: false,
  improper: false,
};

describe("parseDatasetItems", () => {
  it("keeps valid quiz items", () => {
    const result = parseDatasetItems([validItem], "valid.json");

    expect(result.items).toEqual([validItem]);
    expect(result.invalidItemCount).toBe(0);
    expect(result.validationMessages).toEqual([]);
  });

  it("excludes invalid items and reports field-level messages", () => {
    const result = parseDatasetItems(
      [
        validItem,
        {
          id: 123,
          source: "manual",
          comment: "Missing answer title",
        },
      ],
      "mixed.json",
    );

    expect(result.items).toEqual([validItem]);
    expect(result.invalidItemCount).toBe(1);
    expect(result.validationMessages[0]).toContain("mixed.json item 2");
    expect(result.validationMessages[0]).toContain("id must be a string");
    expect(result.validationMessages[0]).toContain("answerTitle must be a string");
  });

  it("reports non-array dataset files without throwing", () => {
    const result = parseDatasetItems({ result: [] }, "object.json");

    expect(result.items).toEqual([]);
    expect(result.invalidItemCount).toBe(0);
    expect(result.validationMessages).toEqual(["object.json: dataset file must contain a QuizItem[] array."]);
  });

  it("reports JSON parse failures without throwing", () => {
    const result = parseDatasetItems(new Error("not valid JSON."), "broken.json");

    expect(result.items).toEqual([]);
    expect(result.validationMessages).toEqual(["broken.json: not valid JSON."]);
  });
});
