import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  getUserPosts,
  getUserReplies,
  getUserReposts,
  likePost,
  repostPost,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

export const postRoutes = express.Router();

//  public route
postRoutes.get("/", getPosts);
postRoutes.get("/:postId", getPost);
postRoutes.get("/user/:username", getUserPosts);
postRoutes.get("/user/:username/replies", getUserReplies);
postRoutes.get("/user/:username/reposts", getUserReposts);

// protected protected
postRoutes.post("/", protectRoute, upload.single("image"), createPost);
postRoutes.post("/:postId/like", protectRoute, likePost);
postRoutes.post("/:postId/repost", protectRoute, repostPost);
postRoutes.delete("/:postId", protectRoute, deletePost);
