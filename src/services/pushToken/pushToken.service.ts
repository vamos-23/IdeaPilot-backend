import { db } from "../../config/firebase";
import { FieldValue } from "firebase-admin/firestore";

type SavedPushToken = {
  userId: string;
  token: string;
  platform: "android" | "ios";
  provider: "expo" | "fcm";
  enabled: boolean;
};

export default async function savePushToken(input: SavedPushToken) {
  const { userId, token, platform, provider, enabled } = input;

  const userRef = db.collection("users").doc(userId);

  const notificationEnabledSnap = await userRef.get();
  if (!notificationEnabledSnap.exists) {
    await userRef.set({
      notificationEnabled: enabled,
    });
  } else {
    const notificationSnap = notificationEnabledSnap.data();
    const enabledStatus = notificationSnap?.notificationEnabled !== enabled;
    if (enabledStatus) {
      await userRef.update({
        notificationEnabled: enabled,
      });
    }
  }

  const tokenRef = userRef.collection("pushTokens").doc(token);
  const docSnap = await tokenRef.get();

  if (!docSnap.exists) {
    await tokenRef.set({
      token,
      platform,
      provider,
      enabled,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    const dataSnap = docSnap.data();

    const hasChanged =
      dataSnap?.platform !== platform ||
      dataSnap?.provider !== provider ||
      dataSnap?.enabled !== enabled;

    if (hasChanged) {
      await tokenRef.update({
        platform,
        provider,
        enabled,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }
}
