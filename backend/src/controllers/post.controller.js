import asyncHandler from "express-async-handler";
import { Post } from "../models/post.model.js";
import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import cloudinary from "../config/cloudinary.js";
import { format } from "path";
import { Notification } from "../models/notification.model.js";
import { Comment } from "../models/comment.model.js";

const addRepostCounts = async (posts) => {
  const postIds = posts.map((post) => post._id);
  const counts = await Post.aggregate([
    { $match: { repostedPost: { $in: postIds } } },
    { $group: { _id: "$repostedPost", count: { $sum: 1 } } },
  ]);
  const countByPostId = new Map(
    counts.map((item) => [item._id.toString(), item.count]),
  );

  return posts.map((post) => ({
    ...post.toObject(),
    repostCount: countByPostId.get(post._id.toString()) || 0,
  }));
};

export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "repostedPost",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });
  const postsWithRepostCounts = await addRepostCounts(posts);

  res.status(200).json({ posts: postsWithRepostCounts });
});

export const getPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId)
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  if (!post) return res.status(404).json({ error: "Post not found" });

  const [postWithRepostCount] = await addRepostCounts([post]);

  res.status(200).json({ post: postWithRepostCount });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });
  const posts = await Post.find({ user: user?._id })
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "repostedPost",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

  const postsWithRepostCounts = await addRepostCounts(posts);

  res.status(200).json({ posts: postsWithRepostCounts });
});

const populatePostDetails = (query) =>
  query
    .sort({ createdAt: -1 })
    .populate("user", "username firstName lastName profilePicture")
    .populate({
      path: "repostedPost",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    })
    .populate({
      path: "comments",
      populate: {
        path: "user",
        select: "username firstName lastName profilePicture",
      },
    });

export const getUserReplies = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const comments = await Comment.find({ user: user._id }).select("post");
  const postIds = comments.map((comment) => comment.post);
  const posts = await populatePostDetails(Post.find({ _id: { $in: postIds } }));
  const postsWithRepostCounts = await addRepostCounts(posts);

  res.status(200).json({ posts: postsWithRepostCounts });
});

export const getUserReposts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const posts = await populatePostDetails(
    Post.find({ user: user._id, repostedPost: { $ne: null } }),
  );
  const postsWithRepostCounts = await addRepostCounts(posts);

  res.status(200).json({ posts: postsWithRepostCounts });
});

export const createPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { content } = req.body;
  const imageFile = req.file;

  if (!content && !imageFile)
    return res
      .status(400)
      .json({ error: "Post must contain either text or image" });

  const user = await User.findOne({ clerkId: userId });
  if (!user) return res.status(404).json({ error: "User not found" });

  let imageUrl = "";

  if (imageFile) {
    try {
      // convert buffer to base64 for cloudinary
      const base64Image = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString("base64")}`;

      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "social_media_posts",
        resource_type: "image",
        transformation: [
          { width: 800, height: 600, crop: "limit" },
          { quality: "auto" },
          { format: "auto" },
        ],
      });
      imageUrl = uploadResponse.secure_url;
    } catch (error) {
      console.log("Cloudinary upload error:", error);
      return res.status(400).json({ error: "Failed to upload image" });
    }
  }

  const post = await Post.create({
    user: user._id,
    content: content || "",
    image: imageUrl,
  });

  res.status(201).json({ post });
});

export const likePost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const user = await User.findOne({ clerkId: userId });
  const post = await Post.findById(postId);

  if (!user || !post)
    return res.status(404).json({ error: "User or post not found" });

  const isLiked = post.likes.some(
    (likeId) => likeId.toString() === user._id.toString(),
  );

  if (isLiked) {
    // unlike
    await Post.findByIdAndUpdate(postId, { $pull: { likes: user._id } });
  } else {
    // like
    await Post.findByIdAndUpdate(postId, { $push: { likes: user._id } });
    //  create notification
    if (post.user.toString() !== user._id.toString()) {
      await Notification.create({
        from: user?._id,
        to: post.user,
        type: "like",
        post: postId,
      });
    }
  }

  res.status(200).json({
    message: isLiked ? "Post unliked successsfully" : "Post liked successfully",
  });
});

export const repostPost = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { postId } = req.params;
  const content =
    typeof req.body?.content === "string" ? req.body.content.trim() : "";
  const user = await User.findOne({ clerkId: userId });
  const originalPost = await Post.findById(postId);

  if (!user || !originalPost)
    return res.status(404).json({ error: "User or post not found" });

  const repost = await Post.create({
    user: user._id,
    content,
    repostedPost: originalPost._id,
  });

  res.status(201).json({ repost });
});

export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { userId } = getAuth(req);
  const post = await Post.findById(postId);
  const user = await User.findOne({ clerkId: userId });

  if (!user || !post)
    return res.status(404).json({ error: "User or post not found" });
  const isUserPostedPost = post.user.toString() === user._id.toString();

  if (!isUserPostedPost) {
    return res.status(400).json({ error: "Posted user have access to delete" });
  }
  //  delete all comments on this post
  await Comment.deleteMany({ post: postId });

  await Post.findByIdAndDelete(postId);
  res.status(200).json({ message: "Post Deleted Successfully" });
});
