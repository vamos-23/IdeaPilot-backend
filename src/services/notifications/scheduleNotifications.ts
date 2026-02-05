import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../../config/firebase";
import { ScheduledNotification } from "../../types/notifications/notification.types";

export async function scheduleNotifications({
  userId,
  title,
  body,
  sendAt,
  data,
  status,
}: ScheduledNotification) {
  await db
    .collection("users")
    .doc(userId)
    .collection("scheduleNotifications")
    .add({
      user_id: userId,
      title: title,
      body: body,
      data: data ?? {},
      sendAt: Timestamp.fromDate(sendAt),
      status: status,
      createdAt: FieldValue.serverTimestamp(),
    });
}
