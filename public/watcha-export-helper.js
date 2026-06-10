(async function watchaDoingExportHelper() {
  const contentTypes = ["movies"];
  const userId = getUserId();

  if (!userId) {
    alert("Watcha Pedia user page에서 실행해주세요.");
    return;
  }

  const overlay = createOverlay();
  const startedAt = new Date().toISOString();

  try {
    const rawComments = [];

    for (const contentType of contentTypes) {
      overlay.setMessage(`${contentType} 코멘트 불러오는 중...`);
      const comments = await fetchAll(`/api/users/${userId}/contents/${contentType}/comments?order=recent`, (count) => {
        overlay.setMessage(`${contentType} 코멘트 ${count}개 불러옴`);
      });
      rawComments.push(...comments);
    }

    const items = dedupe(rawComments.map(normalizeComment).filter(isMovieQuizItem));
    const payload = {
      schema: "watcha-doing-with-my-comments/export-v1",
      source: "watcha-pedia-browser-helper",
      sourceUrl: location.href,
      userId,
      exportedAt: startedAt,
      itemCount: items.length,
      items,
    };

    downloadJson(`${userId}-watcha-comments.json`, payload);
    overlay.setMessage(`완료: ${items.length}개 JSON 다운로드`);
    setTimeout(() => overlay.remove(), 2400);
  } catch (error) {
    console.error(error);
    overlay.setMessage(error instanceof Error ? error.message : "코멘트 불러오기에 실패했습니다.");
  }
})();

function getUserId() {
  const match = location.pathname.match(/\/users\/([^/]+)/u);
  if (match) return decodeURIComponent(match[1]);

  const link = document.querySelector('a[href*="/users/"]');
  const href = link && link.getAttribute("href");
  return href ? href.split("/users/")[1]?.split("/")[0] ?? "" : "";
}

async function fetchAll(initialUrl, onProgress) {
  const items = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    const json = await requestJson(nextUrl);
    const pageItems = json?.result?.result ?? [];
    items.push(...pageItems);
    onProgress?.(items.length);
    nextUrl = json?.result?.next_uri ?? json?.result?.nextUri ?? "";
  }

  return items;
}

async function requestJson(path) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await sleep(650);
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: {
        accept: "application/vnd.frograms+json;version=2.1.0",
        "x-frograms-app-code": "Galaxy",
        "x-frograms-client": "Galaxy-Web-App",
        "x-frograms-client-version": "2.1.0",
        "x-frograms-version": "2.1.0",
        "x-frograms-device-identifier": getDeviceId(),
        "x-frograms-galaxy-language": "ko",
        "x-frograms-galaxy-region": "KR",
      },
    });

    if (response.status === 429) {
      await sleep(10000);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Watcha API ${response.status}: ${path}`);
    }

    return response.json();
  }

  throw new Error(`요청 재시도 한도를 초과했습니다: ${path}`);
}

function normalizeComment(raw, index) {
  const content = raw.content ?? {};
  const userAction = raw.user_content_action ?? raw.userContentAction ?? {};
  const comment = normalizeText(raw.text);
  const title = normalizeText(content.title);

  if (!comment || !title) return null;

  const contentCode = normalizeText(content.code ?? raw.content_code ?? raw.contentCode);
  const commentCode = normalizeText(raw.code);
  const ratingRaw = typeof userAction.rating === "number" ? userAction.rating : null;

  return {
    id: createQuizItemId(contentCode || commentCode || title, comment, index),
    source: "watcha",
    comment,
    answerTitle: title,
    aliases: [],
    year: typeof content.year === "number" ? content.year : null,
    posterUrl: selectPosterUrl(content.poster),
    directorNames: Array.isArray(content.director_names)
      ? content.director_names.filter(Boolean)
      : Array.isArray(content.directorNames)
        ? content.directorNames.filter(Boolean)
        : [],
    ratingRaw,
    ratingStars: ratingRaw === null ? null : ratingRaw / 2,
    createdAt: normalizeText(raw.created_at ?? raw.createdAt) || null,
    spoiler: raw.spoiler === true,
    improper: raw.improper === true,
  };
}

function selectPosterUrl(poster) {
  if (!poster || typeof poster !== "object") return null;
  return poster.large || poster.medium || poster.xlarge || poster.hd || poster.small || null;
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.id}:${item.answerTitle}:${item.comment}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isMovieQuizItem(item) {
  return item && typeof item.id === "string" && item.id.startsWith("watcha-m");
}

function createQuizItemId(base, comment, index) {
  return `watcha-${slugify(base) || "item"}-${hashText(`${base}:${comment}:${index}`)}`;
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 48);
}

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getDeviceId() {
  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("_c_pdi="))
    ?.split("=")[1];

  return cookieValue || `web-${Math.random().toString(36).slice(2)}`;
}

function downloadJson(fileName, payload) {
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function createOverlay() {
  const root = document.createElement("div");
  root.style.cssText =
    "position:fixed;left:0;top:0;right:0;z-index:2147483647;background:#000;color:#fff;border-bottom:4px solid #ff0558;font:14px/1.4 sans-serif;padding:14px 18px";
  root.textContent = "Watcha comments export 준비 중...";
  document.body.appendChild(root);

  return {
    setMessage(message) {
      root.textContent = message;
    },
    remove() {
      root.remove();
    },
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
