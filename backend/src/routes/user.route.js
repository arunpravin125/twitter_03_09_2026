import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

export const userRoutes = express.Router();

// public routes
userRoutes.post("/profile/:username", getUserProfile);

// private routes
userRoutes.post(
  "/profile",
  protectRoute,
  upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  updateProfile,
);
userRoutes.post("/sync", protectRoute, syncUser);
userRoutes.get("/me", protectRoute, getCurrentUser);
userRoutes.post("/follow/:targetUserId", protectRoute, followUser);
