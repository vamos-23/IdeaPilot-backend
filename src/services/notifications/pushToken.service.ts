import { db } from "../../config/firebase";

type SavedPushToken = {
  userId: string;
  token: string;
  platform: "android" | "ios";
  provider: "expo" | "fcm";
  enabled: boolean;
};
export default async function savePushToken(input: SavedPushToken) {
  const { userId, token, platform, provider, enabled } = input;

  const ref = db
    .collection("users")
    .doc(userId)
    .collection("pushTokens")
    .doc(token);

  await ref.set(
    {
      token,
      platform,
      provider,
      enabled,
      updatedAt: new Date(),
      createdAt: new Date(),
    },
    { merge: true }
  );
}
