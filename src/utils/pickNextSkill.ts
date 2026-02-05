import { Skill } from "../types/skills/skills.types";
export function pickNextSkill(
  skills: Skill[],
  lastNotifiedIndex: number,
): {
  nextSkill: Skill | null;
  nextIndex: number;
} {
  const len = skills.length;
  if (len == 0)
    return {
      nextSkill: null,
      nextIndex: -1,
    };
  const nextIndex = (lastNotifiedIndex + 1) % len;
  return {
    nextSkill: skills[nextIndex],
    nextIndex: nextIndex,
  };
}
