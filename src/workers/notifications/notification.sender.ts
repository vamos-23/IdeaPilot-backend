import cron from "node-cron";
import { db } from "../../config/firebase";
import { Timestamp } from "firebase-admin/firestore";
import { sendPushNotification } from "../../services/pushToken/pushTokenSend.service";

export async function startNotificationSender() {
  cron.schedule("* * * * *", async () => {
    const userSnap = await db.collection("users").get();
    const now = Timestamp.now();
    for (const userDoc of userSnap.docs) {
      const notificationSnap = await userDoc.ref
        .collection("scheduledNotifications")
        .where("status", "==", "pending")
        .where("sendAt", "<=", now)
        .limit(10)
        .get();
      for (const notifDoc of notificationSnap.docs) {
        const notifData = notifDoc.data();
        try {
          await sendPushNotification({
            userId: userDoc.id,
            title: notifData.title,
            body: notifData.body,
            data: notifData?.data,
          });

          await notifDoc.ref.update({
            status: "sent",
          });
        } catch (error) {
          await notifDoc.ref.update({
            status: "failed",
          });
          console.error(`Error sending notification to ${userDoc.id}`, error);
        }
      }
    }
  });
}
