import cron from "node-cron";
import { db } from "../../config/firebase";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sendPushNotification } from "../../services/pushToken/pushTokenSend.service";

export default function startNotificationSender() {
  cron.schedule("* * * * *", async () => {
    const userSnap = await db
      .collection("users")
      .where("notificationEnabled", "==", "true")
      .get();
    const now = Timestamp.now();

    for (const userDoc of userSnap.docs) {
      const notificationSnap = await userDoc.ref
        .collection("scheduledNotifications")
        .where("status", "==", "pending")
        .where("sendAt", "<=", now)
        .limit(10)
        .get();

      await Promise.all(
        notificationSnap.docs.map(async (notifDoc) => {
          try {
            await notifDoc.ref.update({
              status: "pending",
              processingAt: FieldValue.serverTimestamp(),
            });

            const notifData = notifDoc.data();
            await sendPushNotification({
              userId: userDoc.id,
              title: notifData.title,
              body: notifData.body,
              data: notifData?.data,
            });

            await notifDoc.ref.update({
              status: "sent",
              sentAt: FieldValue.serverTimestamp(),
            });
          } catch (error) {
            await notifDoc.ref.update({
              status: "failed",
              failureAt: FieldValue.serverTimestamp(),
              error: String(error)
            });
            console.error(`Error sending notification to ${userDoc.id}`, error);
          }
        }),
      );
    }
  });
}
