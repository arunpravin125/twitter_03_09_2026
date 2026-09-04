import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";

export const commentRoutes = express.Router();

// public routes
commentRoutes.get("/post/:postId", getComments);

// protectRoute
commentRoutes.post("/post/:postId", protectRoute, createComment);
commentRoutes.post("/:commentId", protectRoute, deleteComment);
