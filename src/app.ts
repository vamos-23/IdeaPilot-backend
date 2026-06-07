import express from "express";
import cors from "cors";
import errorhandler from "./middlewares/errors.middleware";
import { ChatService } from "./services/chats.service";
import chatRouter from "./routes/chats.route";

export default function createApp() {
  const app = express();

  //chatservice initialization
  ChatService.init().then(() =>
    console.log("HuggingFace Transformer setup initialized."),
  );

  //Global middleware
  app.use(cors());
  app.use(express.json());

  //Health Check
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  //API routes
  app.use("/api/chats", chatRouter);

  //Central Error handler
  app.use(errorhandler);

  return app;
}
