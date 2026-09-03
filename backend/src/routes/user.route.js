import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  syncUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

export const userRoutes = express.Router();

// public routes
userRoutes.post("/profile/:username", getUserProfile);

// private routes
userRoutes.post("/profile", protectRoute, updateProfile);
userRoutes.post("/sync", protectRoute, syncUser);
userRoutes.post("/me", protectRoute, getCurrentUser);
userRoutes.post("/follow/:targetUserId", protectRoute, followUser);
