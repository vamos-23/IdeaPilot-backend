import { Request, Response, NextFunction } from "express";
import admin from "../config/firebase";

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeaders : string | undefined = req.headers.authorization;
    const pushNotifications_enabled : boolean  = req.body;

    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeaders.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      notificationsEnabled: pushNotifications_enabled,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
