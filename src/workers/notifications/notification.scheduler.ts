import cron from "node-cron";
import { db } from "../../config/firebase";
import { scheduleWeeklyNotifications } from "../../services/notifications/scheduleWeeklyNotifications";

export default function runWeeklyNotificationSchedule() {
  //Notification scheduling at 3:00 am
  cron.schedule("0 3 * * *", async () => {
    console.log("[CRON JOB] Weekly notification scheduling started...");
    const userSnapshot = await db
      .collection("users")
      .where("notificationEnabled", "==", "true")
      .get();
    //sequential scheduling
    try {
      for (const userDoc of userSnapshot.docs) {
        const userId = userDoc.id;
        await scheduleWeeklyNotifications(userId);
      }
      console.log("[CRON JOB] Weekly notifications scheduled successfully!");
    } catch (error) {
      console.error("Notification scheduling error!", error);
    }
  });
}
