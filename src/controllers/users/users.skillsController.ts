import { Request, Response } from "express";
import { db } from "../../config/firebase";
import { FieldValue } from "firebase-admin/firestore";
import normalizeIndex from "../../utils/normalizeIndex";

export async function skillsUpdateListener(req: Request, res: Response) {
  try {
    if (!req.user?.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.uid;
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: "Invalid skills payload" });
    }

    const userRef = db.collection("users").doc(userId);

    const userSnap = await userRef.get();
    const userData = userSnap.data();

    const normalizedIndex = normalizeIndex({
      skills_length: skills.length,
      lastIndex: userData?.lastNotifiedSkillIndex ?? -1,
    });

    await userRef.set(
      {
        skills,
        lastNotifiedSkillIndex: normalizedIndex,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: userData?.createdAt ?? FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return res.status(200).json({
      success: true,
      message: "Skills updated successfully",
    });
  } catch (error) {
    console.error("Skills update error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
