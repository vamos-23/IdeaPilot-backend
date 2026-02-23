/*
    Accepts the updated skills array from a POST request and maintains the structure of the skills array in the database for selecting correct skills for sending push notifications
*/
import { Request, Response } from "express";
import { db } from "../../config/firebase";
import { FieldValue } from "firebase-admin/firestore";
import normalizeIndex from "../../utils/normalizeIndex";

export async function skillsUpdateListener(req: Request, res: Response) {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user.uid;
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: "Invalid skills payload" });
  }

  const userRef = db.collection("users").doc(userId);
  let userSnap = await userRef.get();
  if (!userSnap.exists) {
    await userRef.set({
      skills: [],
      lastNotifiedSkillIndex: -1,
      createdAt: FieldValue.serverTimestamp(),
    });
    //Read the updated state of Document reference
    userSnap = await userRef.get();
  }
  const user = userSnap.data();

  const normalizedIndex = normalizeIndex({
    skills_length: skills.length,
    lastIndex: user?.lastNotifiedSkillIndex,
  });

  await userRef.update({
    skills,
    lastNotifiedSkillIndex: normalizedIndex,
  });

  res.json({ success: true });
}
