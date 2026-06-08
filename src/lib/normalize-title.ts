const BRACKETED_TEXT = /[\(\[\{（［｛][^\)\]\}）］｝]*[\)\]\}）］｝]/gu;
const TITLE_PUNCTUATION = /[:：,，.．!！?？"'“”‘’`~\-_/\\|·・…]/gu;

export function normalizeTitle(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(BRACKETED_TEXT, "")
    .replace(TITLE_PUNCTUATION, "")
    .replace(/\s+/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
