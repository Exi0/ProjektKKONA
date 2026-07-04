import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// Všechny notifikace uživatele (stránkované)
notificationRouter.get("/", userAuth, getMyNotifications);

// Pouze počet nepřečtených (lehký polling endpoint pro badge)
notificationRouter.get("/unread-count", userAuth, getUnreadCount);

// Označit jednu jako přečtenou
notificationRouter.patch("/:notificationId/read", userAuth, markAsRead);

// Označit všechny jako přečtené
notificationRouter.patch("/read-all", userAuth, markAllAsRead);

export default notificationRouter;
