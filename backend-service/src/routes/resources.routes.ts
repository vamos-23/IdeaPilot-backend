import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  getYouTubeVideos,
  getGithubRepositories,
} from "../controllers/resources.controller";

const router = Router();

router.use(requireAuth);

router.get("/youtube", getYouTubeVideos);
router.get("/github", getGithubRepositories);

export default router;
