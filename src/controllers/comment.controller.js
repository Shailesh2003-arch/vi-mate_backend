import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {Comment} from "../models/comment.model.js";
import {Video} from "../models/video.models.js";
import mongoose from "mongoose";

export const createComment = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const {text} = req.body;

  // 1. Validate comment text
  if (!text?.trim()) {
    throw new ApiError(400, "Comment text is required");
  }

  // 2. Check if video exists
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 3. Create comment
  const comment = await Comment.create({
    text: text.trim(),
    video: videoId,
    owner: req.user._id,
  });

  // 4. Populate owner details
  const populatedComment = await Comment.findById(comment._id).populate(
    "owner",
    "username avatar.url"
  );

  // 5. Send response
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: populatedComment._id,

        text: populatedComment.text,

        createdAt: populatedComment.createdAt,

        likes: populatedComment.likes,

        dislikes: populatedComment.dislikes,

        repliesCount: populatedComment.repliesCount,

        owner: {
          _id: populatedComment.owner._id,
          username: populatedComment.owner.username,
          avatar: populatedComment.owner.avatar.url,
        },
      },
      "Comment added successfully."
    )
  );
});

export const getCommentsByVideo = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $lookup: {
        from: "users",

        localField: "owner",

        foreignField: "_id",

        as: "owner",
      },
    },

    {
      $unwind: "$owner",
    },

    {
      $project: {
        text: 1,

        createdAt: 1,

        likes: 1,

        dislikes: 1,

        repliesCount: 1,

        owner: {
          _id: "$owner._id",

          username: "$owner.username",

          avatar: "$owner.avatar.url",
        },
      },
    },
  ]);

  const options = {
    page,
    limit,
  };

  const comments = await Comment.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully."));
});

export const updateComment = asyncErrorHandler(async (req, res) => {
  const {commentId} = req.params;
  const {text} = req.body;

  const trimmedText = text?.trim();

  if (!trimmedText) {
    throw new ApiError(400, "Comment text is required");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this comment");
  }

  if (comment.text === trimmedText) {
    return res
      .status(200)
      .json(new ApiResponse(200, comment, "No changes detected"));
  }

  comment.text = trimmedText;

  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

export const deleteComment = asyncErrorHandler(async (req, res) => {
  const {commentId} = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this comment");
  }

  await comment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"));
});
