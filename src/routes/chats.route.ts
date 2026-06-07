import { Router } from "express";
import {
  streamChat,
  getChats,
  getMessages,
} from "../controllers/chats.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/:chatId/stream", streamChat);
router.get("/", getChats);
router.get("/:chatId/messages", getMessages);

export default router;
