export function toRatingStars(ratingRaw: number | null): number | null {
  return ratingRaw === null ? null : ratingRaw / 2;
}

export function formatRatingStars(ratingStars: number | null): string {
  return ratingStars === null ? "평점 없음" : `${ratingStars.toFixed(1)} / 5.0`;
}
