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
    .populate("user", "username firstName lastName profilePicture");

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

  await Post.findByIdAndUpdate(postId, {
    $push: { comments: addComment?._id },
  });

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
  if (!user || user._id.toString() !== comment.user.toString()) {
    return res
      .status(403)
      .json({ error: "You can only delete your own comment" });
  }

  await Post.findByIdAndUpdate(comment.post, {
    $pull: { comments: comment._id },
  });

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Comment deleted successfully" });
});

export const updateComment = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { commentId } = req.params;
  const content = req.body.content?.trim();
  const user = await User.findOne({ clerkId: userId });
  const comment = await Comment.findById(commentId);

  if (!user || !comment)
    return res.status(404).json({ error: "Comment not found" });
  if (user._id.toString() !== comment.user.toString())
    return res
      .status(403)
      .json({ error: "You can only edit your own comment" });
  if (!content)
    return res.status(400).json({ error: "Comment cannot be empty" });

  comment.content = content;
  await comment.save();

  res.status(200).json({ comment });
});
