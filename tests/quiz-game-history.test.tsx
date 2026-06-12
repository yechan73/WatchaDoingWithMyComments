// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QuizGame } from "@/components/quiz/QuizGame";
import type { QuizDataset, QuizItem } from "@/features/quiz/quiz-types";

vi.mock("next/image", () => ({
  default: ({ src, priority, alt, ...props }: { src: string | { src: string }; priority?: boolean; alt: string }) => {
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={typeof src === "string" ? src : src.src} alt={alt} {...props} />
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("QuizGame browser history", () => {
  it("returns to the app home screen when the browser back button is used during play", async () => {
    window.history.replaceState(null, "", "/");
    render(<QuizGame datasets={[makeDataset()]} />);

    fireEvent.click(screen.getByRole("button", { name: /시작/ }));

    expect(screen.getByText("1 / 5")).toBeTruthy();

    window.history.back();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /시작/ })).toBeTruthy();
    });
    expect(screen.queryByText("1 / 5")).toBeNull();
  });

  it("shows a judgement overlay before the answer reveal", async () => {
    vi.useFakeTimers();
    render(<QuizGame datasets={[makeDataset()]} />);

    fireEvent.click(screen.getByRole("button", { name: /시작/ }));
    fireEvent.change(screen.getByLabelText("영화 제목"), { target: { value: "submitted answer" } });
    fireEvent.click(screen.getByRole("button", { name: "정답 제출" }));

    expect(screen.queryByLabelText("영화 제목")).toBeNull();
    expect(screen.getByText("오답")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "다음 문제" })).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByRole("button", { name: "다음 문제" })).toBeTruthy();
  });
});

function makeDataset(): QuizDataset {
  return {
    id: "test-dataset",
    label: "Test comments",
    description: "Test dataset",
    items: Array.from({ length: 5 }, (_, index) => makeItem(String(index + 1))),
    invalidItemCount: 0,
    validationMessages: [],
  };
}

function makeItem(id: string): QuizItem {
  return {
    id,
    source: "manual",
    comment: `Comment ${id}`,
    answerTitle: `Movie ${id}`,
    aliases: [],
    year: null,
    posterUrl: null,
    directorNames: [],
    ratingRaw: null,
    ratingStars: null,
    createdAt: null,
    spoiler: false,
    improper: false,
  };
}
