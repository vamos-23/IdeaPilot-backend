import express from "express";
import cors from "cors";
import errorhandler from "./middlewares/errors.middleware";
import { EmbeddingService } from "./services/ai/embedding.service";
import chatRouter from "./routes/chats.route";
import resourcesRouter from "./routes/resources.routes";

export default function createApp() {
  const app = express();

  //Chat service model embedder initialization
  EmbeddingService.init().then(() =>
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
  app.use("/api/resources", resourcesRouter);

  //Central Error handler
  app.use(errorhandler);

  return app;
}
