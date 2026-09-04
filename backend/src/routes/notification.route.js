import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  deleteNotification,
  getNotifications,
} from "../controllers/notification.controller.js";

export const notificationRoutes = express.Router();

notificationRoutes.get("/", protectRoute, getNotifications);
notificationRoutes.get("/:notificationId", protectRoute, deleteNotification);
