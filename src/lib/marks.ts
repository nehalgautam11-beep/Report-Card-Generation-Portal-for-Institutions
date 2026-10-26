export type MarkValue = number | string;

export const isAbsentMark = (value: unknown): boolean =>
  typeof value === "string" && value.trim().toUpperCase() === "AB";

export const markToScore = (value: unknown): number => {
  if (isAbsentMark(value)) return 0;
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
};

export const displayMark = (value: unknown): string =>
  isAbsentMark(value) ? "Ab" : String(markToScore(value));

export const parseImportedMark = (value: unknown): MarkValue => {
  if (isAbsentMark(value)) return "Ab";
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isValidMarkInput = (value: unknown, max: number): boolean => {
  if (isAbsentMark(value)) return true;
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return false;
  const score = Number(text);
  return score >= 0 && score <= max;
};

export const markForPayload = (value: unknown): MarkValue => {
  if (isAbsentMark(value)) return "Ab";
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
};
