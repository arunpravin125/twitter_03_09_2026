import { getAuth } from "@clerk/express";
import expressAsyncHandler from "express-async-handler";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";

export const getNotifications = expressAsyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });

  const notification = await Notification.find({ to: user?._id })
    .sort({ created: -1 })
    .populate("from", "username firstName lastName profilePciture")
    .populate("post", "content image")
    .populate("comment", "content");

  res.status(200).json({ notification });
});

export const deleteNotification = expressAsyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { notificationId } = req.params;

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  const notification = await Notification.findByIdAndDelete({
    _id: notificationId,
    to: user._id,
  });

  if (!notification)
    return res.status(404).json({ error: "Notification not found" });

  res.status(200).json({ message: "Notification deleted successfully" });
});
