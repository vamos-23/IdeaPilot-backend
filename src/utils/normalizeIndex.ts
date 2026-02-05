export default function normalizeIndex(input: {
  skills_length: number;
  lastIndex: number;
}) {
  const { skills_length, lastIndex } = input;
  if (lastIndex < 0) return -1;
  if (skills_length == 0) return -1;
  if (lastIndex >= skills_length) return skills_length - 1;
  return lastIndex;
}
