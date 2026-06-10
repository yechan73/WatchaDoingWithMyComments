import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { importWatchaComments, resolveWatchaCommentsSource } from "../scripts/import-watcha-comments";

let originalCwd = "";
let tempDir = "";

beforeEach(async () => {
  originalCwd = process.cwd();
  tempDir = await mkdtemp(join(tmpdir(), "watcha-import-"));
  process.chdir(tempDir);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { force: true, recursive: true });
});

describe("resolveWatchaCommentsSource", () => {
  it("accepts a Watcha Pedia user id", () => {
    expect(resolveWatchaCommentsSource("VRZv4O9DPqr6y")).toMatchObject({
      userId: "VRZv4O9DPqr6y",
      commentsUrl: "https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments",
      datasetId: "vrzv4o9dpqr6y-watcha-comments",
      outputPath: "src/data/users/vrzv4o9dpqr6y-watcha-comments.json",
    });
  });

  it("accepts profile and comments URLs", () => {
    expect(resolveWatchaCommentsSource("pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments").userId).toBe("VRZv4O9DPqr6y");
    expect(resolveWatchaCommentsSource("https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y").commentsUrl).toBe(
      "https://pedia.watcha.com/ko/users/VRZv4O9DPqr6y/comments",
    );
  });

  it("rejects unsupported hosts", () => {
    expect(() => resolveWatchaCommentsSource("https://example.test/ko/users/VRZv4O9DPqr6y/comments")).toThrow(/pedia\.watcha\.com/u);
  });
});

describe("importWatchaComments", () => {
  it("writes normalized quiz items and updates the manifest", async () => {
    await writeFile("comments.html", makeRenderedCommentsListHtml(), "utf8");

    const result = await importWatchaComments({
      source: "VRZv4O9DPqr6y",
      inputPath: "comments.html",
      inputFormat: "html",
      updateManifest: true,
    });

    const output = JSON.parse(await readFile(result.outputPath, "utf8")) as Array<{ answerTitle: string; posterUrl: string }>;
    const manifest = JSON.parse(await readFile("src/data/manifest.json", "utf8")) as Array<{ id: string; itemCount: number }>;

    expect(result.itemCount).toBe(1);
    expect(output[0]).toMatchObject({
      answerTitle: "List Film",
      posterUrl: "https://example.test/list-poster.jpg",
    });
    expect(manifest).toContainEqual(
      expect.objectContaining({
        id: "vrzv4o9dpqr6y-watcha-comments",
        itemCount: 1,
      }),
    );
  });

  it("auto-detects exported helper JSON payloads with normalized quiz items", async () => {
    await writeFile(
      "helper-output.json",
      JSON.stringify({
        schema: "watcha-doing-with-my-comments/export-v1",
        items: [makeQuizItem(), makeQuizItem(), makeQuizItem({ id: "watcha-te6y4gy-1hwpal5", answerTitle: "TV Show" })],
      }),
      "utf8",
    );

    const result = await importWatchaComments({
      source: "VRZv4O9DPqr6y",
      inputPath: "helper-output.json",
      updateManifest: false,
    });

    const output = JSON.parse(await readFile(result.outputPath, "utf8")) as Array<{ answerTitle: string }>;

    expect(result.itemCount).toBe(1);
    expect(output[0].answerTitle).toBe("Helper Movie");
  });
});

function makeQuizItem(overrides: Partial<ReturnType<typeof makeQuizItemBase>> = {}) {
  return { ...makeQuizItemBase(), ...overrides };
}

function makeQuizItemBase() {
  return {
    id: "watcha-m-helper-1",
    source: "watcha",
    comment: "Helper comment",
    answerTitle: "Helper Movie",
    aliases: [],
    year: 2024,
    posterUrl: null,
    directorNames: ["Helper Director"],
    ratingRaw: 8,
    ratingStars: 4,
    createdAt: null,
    spoiler: false,
    improper: false,
  };
}

function makeRenderedCommentsListHtml(): string {
  return `
    <main>
      <div class="_comments_1abc">
        <ul>
          <li>
            <a href="/ko/contents/m-list-film" title="List Film">
              <img alt="List Film" src="https://example.test/list-poster.jpg?token=remove-me" />
            </a>
            <p class="_meta_def">영화 · 2024</p>
            <div class="_rating_xyz"><p>2</p></div>
            <a href="/ko/comments/comment-2">
              <p class="CommentText">스크롤해서 로딩된 코멘트</p>
            </a>
          </li>
        </ul>
      </div>
    </main>
  `;
}
