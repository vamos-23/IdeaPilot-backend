import { Router } from "express";
import {
  streamChat,
  getChats,
  getMessages,
  deleteChat,
} from "../controllers/chats.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.use(requireAuth);

router.get("/:chatId/stream", streamChat);
router.get("/", getChats);
router.get("/:chatId/messages", getMessages);
router.delete("/:chatId", deleteChat);

export default router;
