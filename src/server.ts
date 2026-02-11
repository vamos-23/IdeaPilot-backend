import "dotenv/config";
import createApp from "./app";
import runWeeklyNotificationSchedule from "./workers/notifications/notification.scheduler";
import startNotificationSender from "./workers/notifications/notification.sender";

const server = createApp();
const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  runWeeklyNotificationSchedule();
  startNotificationSender();
});
