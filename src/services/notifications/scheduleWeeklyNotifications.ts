import { db } from "../../config/firebase";
import { FieldValue } from "firebase-admin/firestore";
import { scheduleNotifications } from "./scheduleNotifications";
import { Skill } from "../../types/skills/skills.types";
import { pickNextSkill } from "../../utils/pickNextSkill";

export async function scheduleWeeklyNotifications(userId: string) {
  const DAYS = 24 * 60 * 60 * 1000;

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const user = userSnap.data();
  const username = user?.name ?? "User"; //need displayname from frontend
  const skills: Skill[] = user?.skills ?? [];
  const lastNotifiedIndex = user?.lastNotifiedSkillIndex ?? -1;

  //Defer notification scheduling of skill based notification till next week
  if (user?.lastNotifiedSkillTimestamp) {
    const last = user?.lastNotifiedSkillTimestamp.toDate();
    const diffDays = (Date.now() - last.getTime()) / DAYS;
    if (diffDays < 7) return;
  }

  const result = pickNextSkill(skills, lastNotifiedIndex);
  const { nextSkill, nextIndex } = result;
  const now = new Date();

  //Send 3 notifications per week
  //Day 0
  await scheduleNotifications({
    userId,
    title: "Welcome back👋",
    body: "Continue building and exploring new ideas today",
    sendAt: now,
    status: "pending",
    data: { screen: "dashboard" },
  });
  //Day 3
  if (nextSkill) {
    await scheduleNotifications({
      userId,
      title: `${username}, try a new challenge 💡!`,
      body: `Build an idea using ${nextSkill}`,
      sendAt: new Date(now.getTime() + 3 * DAYS),
      status: "pending",
      data: { screen: "ideas", skill_id: nextSkill.id },
    });
  }
  //Day 5
  await scheduleNotifications({
    userId,
    title: "Keep the momentum going 🔥🚀!",
    body: "Refine your ideas and make real progress this week.",
    sendAt: new Date(now.getTime() + 5 * DAYS),
    status: "pending",
    data: { screen: "dashboard" },
  });

  //Update the lastNotifiedIndex and its timestamp
  await userRef.update({
    lastNotifiedSkillIndex: nextIndex,
    lastNotifiedSkillTimestamp: FieldValue.serverTimestamp(),
  });
}
