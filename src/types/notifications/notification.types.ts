import "express";
import { FieldValue } from "firebase-admin/firestore";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        notificationsEnabled?: boolean;
      };
    }
  }
}

export type ScheduledNotification = {
  userId: string;
  title: string;
  body: string;
  data: Record<string, any>;
  sendAt: Date;
  status: "pending" | "sent" | "failed";
};
