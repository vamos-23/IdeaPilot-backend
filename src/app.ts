import express from "express";
import cors from "cors";
import routes from "./routes/index";
import errorhandler from "./middlewares/errors.middleware";

export default function createApp() {
  const app = express();

  //Global middleware
  app.use(cors());
  app.use(express.json());

  //Health Check
  app.use("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  //API routes
  app.use("/api", routes);

  //Central Error handler
  app.use(errorhandler);

  return app;
}
