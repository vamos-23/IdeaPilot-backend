import { Request, Response } from "express";
import savePushToken from "../../services/notifications/pushToken.service";

export default async function registerPushToken(req: Request, res: Response) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.user.id;
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
