import { Router } from "express";
import requireAuth from "../../middlewares/firebaseAuth.middleware";
import { skillsUpdateListener } from "../../controllers/users/users.controller";
const router = Router();

router.post("/users/skills", requireAuth, skillsUpdateListener);

export default router;
