//import "dotenv/config";
import runWeeklyNotificationSchedule from "./workers/notifications/notification.scheduler";
import startNotificationSender from "./workers/notifications/notification.sender";

console.log("Notification worker starting....");

runWeeklyNotificationSchedule();
startNotificationSender();
