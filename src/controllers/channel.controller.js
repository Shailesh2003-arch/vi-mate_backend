import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import {Video} from "../models/video.models.js";
import {Subscription} from "../models/subscription.model.js";
import {User} from "../models/user.models.js";
import mongoose from "mongoose";

export const getChannelDetails = asyncErrorHandler(async (req, res) => {
  const {channelId} = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  const channel = await User.findById(channelId).select(
    "username avatar coverImage subscribersCount"
  );

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  const [videosCount, isSubscribed] = await Promise.all([
    Video.countDocuments({
      owner: channelId,
    }),

    Subscription.exists({
      subscriber: req.user._id,
      channel: channelId,
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: channel._id,

        username: channel.username,

        avatar: channel.avatar,

        coverImage: channel.coverImage,

        subscribersCount: channel.subscribersCount,

        videosCount,

        isSubscribed: !!isSubscribed,
      },
      "Channel details fetched successfully"
    )
  );
});

export const getChannelVideos = asyncErrorHandler(async (req, res) => {
  const {channelId} = req.params;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;

  const aggregate = Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
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
  ]);

  const options = {
    page,
    limit,
  };

  const result = await Video.aggregatePaginate(aggregate, options);

  const formattedVideos = result.docs.map((video) => ({
    _id: video._id,

    title: video.title,

    thumbnail: video.thumbnail,

    duration: video.duration,

    views: video.views,

    createdAt: video.createdAt,

    owner: {
      _id: video.owner._id,
      username: video.owner.username,
      avatar: video.owner.avatar,
    },
  }));
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        docs: formattedVideos,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
      "Channel videos fetched successfully"
    )
  );
});
