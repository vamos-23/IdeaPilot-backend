import { Router } from "express";
import notificationRoutes from "./notifications/notifications.routes";
import userRoutes from "./users/users.skills.routes";
const router = Router();

router.use(notificationRoutes);
router.use(userRoutes);
export default router;
