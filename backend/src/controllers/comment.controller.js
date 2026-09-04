import asyncHandler from "express-async-handler";
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const comments = await Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("user", "username fristName lastName profilePicture");

  res.status(200).json({ comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const { content } = req.body;
  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post)
    return res.status(404).json({ error: "User or Post not found" });

  const addComment = await Comment.create({
    content,
    user: user?._id,
    post: post?._id,
  });
  await addComment.save();

  await Post.findByIdAndUpdate(postId, { $push: { comment: addComment?._id } });

  if (post?.user?.toString() !== user?._id.toString()) {
    await Notification.create({
      from: user?._id,
      to: post.user,
      type: "comment",
      post: postId,
      comment: addComment?._id,
    });
  }

  res.status(201).json({ comment: addComment });
});
export const deleteComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;
  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);
  if (!comment) return res.status(404).json({ error: "comment not found" });
  if (user?._id.toString() !== comment?.user?._id.toString()) {
    return res.status(400).json({ error: "comment user can delete post" });
  }

  await Post.findByIdAndUpdate(comment?.post._id, {
    $pull: { comment: comment?._id },
  });

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Comment deleted successfully" });
});
