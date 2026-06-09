import { describe, expect, it } from "vitest";
import {
  extractRawComments,
  normalizeWatchaComments,
  parseDatasetInput,
  parseRenderedWatchaHtmlComments,
} from "../scripts/normalize-watcha-comments";

const firstComment = {
  code: "comment-1",
  text: "Great rainy mood",
  created_at: "2026-01-01T00:00:00.000Z",
  spoiler: false,
  improper: false,
  content: {
    code: "movie-1",
    title: "Rain Movie",
    year: 2025,
    poster: {
      medium: "https://example.test/poster-medium.jpg",
      large: "https://example.test/poster-large.jpg",
    },
    director_names: ["Kim Director"],
  },
  user_content_action: {
    rating: 8,
  },
};

const secondComment = {
  code: "comment-2",
  text: "Tiny but sharp",
  spoiler: false,
  improper: false,
  content: {
    code: "movie-2",
    title: "Small Film",
    year: 2024,
    poster: {},
    director_names: [],
  },
  user_content_action: {
    rating: 7,
  },
};

describe("extractRawComments", () => {
  it("extracts comments from a single Watcha-like response", () => {
    const input = {
      result: {
        next_uri: "/api/users/test/contents/movie/comments?page=2",
        result: [firstComment],
      },
    };

    expect(extractRawComments(input)).toEqual([firstComment]);
  });

  it("extracts comments from multiple page responses", () => {
    const input = [
      { result: { result: [firstComment] } },
      { result: { result: [secondComment] } },
    ];

    expect(extractRawComments(input)).toEqual([firstComment, secondComment]);
  });

  it("keeps arrays already cut down to raw comments", () => {
    expect(extractRawComments([firstComment, secondComment])).toEqual([firstComment, secondComment]);
  });
});

describe("parseDatasetInput", () => {
  it("explains when the input is rendered HTML instead of JSON", () => {
    expect(() => parseDatasetInput('<ul class="comments"><li>Not JSON</li></ul>')).toThrow(/looks like HTML/u);
  });

  it("accepts rendered HTML when the html input format is explicit", () => {
    const input = parseDatasetInput(makeRenderedCommentHtml(), "html");

    expect(normalizeWatchaComments(input)).toHaveLength(1);
  });
});

describe("parseRenderedWatchaHtmlComments", () => {
  it("extracts local rendered Watcha comment markup into raw comments", () => {
    const [rawComment] = parseRenderedWatchaHtmlComments(makeRenderedCommentHtml());

    expect(rawComment).toMatchObject({
      code: "comment-1",
      text: "A remembered line",
      content: {
        code: "content-1",
        title: "Rendered Film",
        year: 1999,
        poster: {
          large: "https://example.test/poster.jpg",
        },
        director_names: [],
      },
      user_content_action: {
        rating: 7,
      },
      spoiler: false,
      improper: false,
    });
  });
});

describe("normalizeWatchaComments", () => {
  it("normalizes raw comments into quiz items", () => {
    const [item] = normalizeWatchaComments([firstComment]);

    expect(item).toMatchObject({
      source: "watcha",
      comment: "Great rainy mood",
      answerTitle: "Rain Movie",
      aliases: [],
      year: 2025,
      posterUrl: "https://example.test/poster-large.jpg",
      directorNames: ["Kim Director"],
      ratingRaw: 8,
      ratingStars: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
      spoiler: false,
      improper: false,
    });
    expect(item.id).toMatch(/^watcha-/u);
  });

  it("filters empty comments, missing titles, spoilers, improper items, and duplicates by default", () => {
    const spoilerComment = { ...secondComment, code: "spoiler", text: "Spoiler", spoiler: true };
    const improperComment = { ...secondComment, code: "improper", text: "Improper", improper: true };
    const emptyComment = { ...secondComment, code: "empty", text: "" };
    const missingTitle = { ...secondComment, code: "missing", content: { ...secondComment.content, title: "" } };

    const items = normalizeWatchaComments([
      firstComment,
      { ...firstComment, code: "duplicate" },
      spoilerComment,
      improperComment,
      emptyComment,
      missingTitle,
    ]);

    expect(items).toHaveLength(1);
    expect(items[0].answerTitle).toBe("Rain Movie");
  });

  it("can include spoilers and apply a minimum comment length", () => {
    const spoilerComment = { ...secondComment, text: "Long enough spoiler", spoiler: true };

    const items = normalizeWatchaComments([secondComment, spoilerComment], {
      includeSpoilers: true,
      minCommentLength: 16,
    });

    expect(items).toHaveLength(1);
    expect(items[0].comment).toBe("Long enough spoiler");
  });
});

function makeRenderedCommentHtml(): string {
  return `
    <ul>
      <li>
        <article>
          <header>
            <div class="_rating_abc"><p>3.5</p></div>
          </header>
          <section>
            <a title="Rendered Film" href="/ko/contents/content-1">
              <img src="https://example.test/poster.jpg?jwt=secret" />
            </a>
            <p class="_meta_abc">영화 ・ 1999</p>
          </section>
          <a href="/ko/comments/comment-1">
            <p class="CommentText">A remembered line</p>
          </a>
        </article>
      </li>
    </ul>
  `;
}
