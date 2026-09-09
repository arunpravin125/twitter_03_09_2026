import { User } from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { clerkClient, getAuth } from "@clerk/express";
import { Notification } from "../models/notification.model.js";
import cloudinary from "../config/cloudinary.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username });

  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!query) return res.status(200).json({ users: [] });

  const expression = new RegExp(
    query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i",
  );
  const users = await User.find({
    $or: [
      { username: expression },
      { firstName: expression },
      { lastName: expression },
    ],
  })
    .select("_id username firstName lastName profilePicture bio")
    .sort({ username: 1 })
    .limit(20)
    .lean();

  res.status(200).json({ users });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const updateData = { ...req.body };
  const profilePictureFile = req.files?.profilePicture?.[0];
  const bannerImageFile = req.files?.bannerImage?.[0];

  for (const [field, file] of [
    ["profilePicture", profilePictureFile],
    ["bannerImage", bannerImageFile],
  ]) {
    if (!file) continue;

    const base64Image = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "social_media_profiles",
      resource_type: "image",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { format: "auto" },
      ],
    });
    updateData[field] = uploadResponse.secure_url;
  }

  const user = await User.findOneAndUpdate({ clerkId: userId }, updateData, {
    new: true,
  });
  if (!user) return res.status(404).json({ error: "User not found" });

  res.status(200).json({ user });
});

export const syncUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);

  const existingUser = await User.findOne({ clerkId: userId });

  //  check the user Already exists
  if (existingUser) {
    return res
      .status(200)
      .json({ user: existingUser, message: "User already exists" });
  }

  //  create new user from clerk data
  const clerkUser = await clerkClient.users.getUser(userId);
  const userData = {
    clerkId: userId,
    email: clerkUser.emailAddresses[0].emailAddress,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
    username:
      clerkUser.emailAddresses[0].emailAddress.split("@")[0] + "_" + Date.now(),
    profilePicture: clerkUser.imageUrl || "",
  };

  const user = await User.create(userData);
  await user.save();

  res.status(201).json({ user, message: "User created Successfully" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const user = await User.findOne({ clerkId: userId });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.status(200).json({ user });
});

export const getRelationshipUsers = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { type } = req.params;
  const currentUser = await User.findOne({ clerkId: userId });

  if (!currentUser) return res.status(404).json({ error: "User not found" });
  if (!["followers", "following"].includes(type)) {
    return res.status(400).json({ error: "Invalid relationship type" });
  }

  const relationshipIds = currentUser[type] || [];
  const users = await User.find({ _id: { $in: relationshipIds } })
    .select("_id username firstName lastName profilePicture bio")
    .lean();
  const followingIds = new Set(
    currentUser.following.map((id) => id.toString()),
  );

  res.status(200).json({
    users: users.map((user) => ({
      ...user,
      isFollowing: followingIds.has(user._id.toString()),
    })),
  });
});

export const followUser = asyncHandler(async (req, res) => {
  const { userId } = getAuth(req);
  const { targetUserId } = req.params;

  if (userId === targetUserId)
    return res.status(400).json({ error: "You cannot follow yourself" });

  const currentUser = await User.findOne({ clerkId: userId });
  const targetUser = await User.findById(targetUserId);

  if (!currentUser || !targetUser)
    return res.status(404).json({ error: "User not found" });

  const isFollowing = currentUser.following.some(
    (followingId) => followingId.toString() === targetUserId,
  );

  if (isFollowing) {
    // unfollow
    await User.findByIdAndUpdate(currentUser._id, {
      $pull: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: currentUser._id },
    });
  } else {
    // follow
    await User.findByIdAndUpdate(currentUser._id, {
      $push: { following: targetUserId },
    });
    await User.findByIdAndUpdate(targetUserId, {
      $push: { followers: currentUser._id },
    });
    //  create notification
    await Notification.create({
      from: currentUser?._id,
      to: targetUser._id,
      type: "follow",
    });
  }

  res.status(200).json({
    message: isFollowing
      ? "User unfollowed Successfully"
      : "user followed successfully",
  });
});
