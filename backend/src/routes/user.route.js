import express from "express";
import {
  followUser,
  getCurrentUser,
  getUserProfile,
  getRelationshipUsers,
  searchUsers,
  syncUser,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

export const userRoutes = express.Router();

// public routes
userRoutes.post("/profile/:username", getUserProfile);
userRoutes.get("/search", protectRoute, searchUsers);

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
userRoutes.get("/relationships/:type", protectRoute, getRelationshipUsers);
userRoutes.post("/follow/:targetUserId", protectRoute, followUser);
