import { Expo } from "expo-server-sdk";
import { db } from "../../config/firebase";

const expo = new Expo();

export async function sendPushNotification(input: {
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
}) {
  //send push notifications to only users with enabled flag set to true
  const userId = input.userId;
  const tokenSnap = await db
    .collection("users")
    .doc(userId)
    .collection("pushTokens")
    .where("enabled", "==", true)
    .get();

  if (tokenSnap.empty) return; //no registered device for the user

  const messages = tokenSnap.docs
    .map((doc) => doc.id)
    .filter(Expo.isExpoPushToken)
    .map((token) => ({
      to: token,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    }));

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
