import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";

declare global {
  namespace Express {
    interface Request {
      user: {
        uid: string;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeaders: string | undefined = req.headers.authorization;

    if (!authHeaders || !authHeaders.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeaders.split(" ")[1];

    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
    };

    next();
  } catch (error) {
    console.error("Auth Error:", error);
    res.status(403).json({ error: "Forbidden: Invalid token" });
  }
}
