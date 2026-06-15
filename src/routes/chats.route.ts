import { Router } from "express";
import {
  streamChat,
  getChats,
  getMessages,
  deleteChat,
  togglePin,
  rename,
} from "../controllers/chats.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getChats);
router.get("/:chatId/messages", getMessages);
router.get("/:chatId/stream", streamChat);

router.patch("/:chatId/pin", togglePin);
router.patch("/:chatId/rename", rename);

router.delete("/:chatId", deleteChat);

export default router;
