import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
  getUserPosts,
  likePost,
} from "../controllers/post.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

export const postRoutes = express.Router();

//  public route
postRoutes.get("/posts", getPosts);
postRoutes.get("/:postId", getPost);
postRoutes.get("/user/:username", getUserPosts);

// protected protected
postRoutes.post("/", protectRoute, upload.single("image"), createPost);
postRoutes.post("/:postId/like", protectRoute, likePost);
postRoutes.delete("/:postId", protectRoute, deletePost);
