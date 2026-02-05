import { Request, Response } from "express";
import savePushToken from "../../services/pushToken/pushToken.service";

export default async function registerPushToken(req: Request, res: Response) {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.uid;
  const { token, platform, provider, enabled } = req.body;

  if (!token || !platform || !provider) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  await savePushToken({
    userId,
    token,
    platform,
    provider,
    enabled,
  });

  res.json({ success: true });
}
