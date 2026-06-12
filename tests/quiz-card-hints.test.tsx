// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuizCard } from "@/components/quiz/QuizCard";
import type { QuizItem } from "@/features/quiz/quiz-types";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string | { src: string }; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : src.src} alt={alt} {...props} />
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("QuizCard hint timing", () => {
  it("does not show hints before 10 seconds", () => {
    render(<QuizCard item={item} elapsedSeconds={9} revealed={false} />);

    expect(screen.queryByText("내 평점")).toBeNull();
    expect(screen.queryByText("감독")).toBeNull();
    expect(screen.queryByText("개봉년도")).toBeNull();
    expect(screen.queryByText("제목 초성")).toBeNull();
  });

  it("shows rating, director, and release year after 10 seconds", () => {
    render(<QuizCard item={item} elapsedSeconds={10} revealed={false} />);

    expect(screen.getByText("내 평점")).toBeTruthy();
    expect(screen.getByText("4.0 / 5.0")).toBeTruthy();
    expect(screen.getByText("감독")).toBeTruthy();
    expect(screen.getByText("개봉년도")).toBeTruthy();
    expect(screen.getByText("Test Director")).toBeTruthy();
    expect(screen.getByText("2024")).toBeTruthy();
    expect(screen.queryByText("제목 초성")).toBeNull();
  });

  it("shows title initials after 20 seconds", () => {
    render(<QuizCard item={item} elapsedSeconds={20} revealed={false} />);

    expect(screen.getByText("제목 초성")).toBeTruthy();
    expect(screen.getByText("ㅌㅅㅌ ㅁㅂ")).toBeTruthy();
  });

  it("shows comments without wrapping quotation marks", () => {
    render(<QuizCard item={item} elapsedSeconds={0} revealed={false} />);

    expect(screen.getByText("Test comment")).toBeTruthy();
    expect(screen.queryByText("“Test comment”")).toBeNull();
  });
});

const item: QuizItem = {
  id: "test-item",
  source: "manual",
  comment: "Test comment",
  answerTitle: "테스트 무비",
  aliases: [],
  year: 2024,
  posterUrl: null,
  directorNames: ["Test Director"],
  ratingRaw: 8,
  ratingStars: 4,
  createdAt: null,
  spoiler: false,
  improper: false,
};
