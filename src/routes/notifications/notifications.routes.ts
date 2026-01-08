import { Router } from "express";
import requireAuth from "../../middlewares/firebaseAuth.middleware";
import registerPushToken from "../../controllers/notifications/notifications.controller";

const router = Router();

router.post("/users/push-token", requireAuth, registerPushToken);
export default router;
