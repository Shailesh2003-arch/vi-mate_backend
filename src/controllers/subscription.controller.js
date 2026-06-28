import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import {Subscription} from "../models/subscription.model.js";
import {User} from "../models/user.models.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
// This controllers are of subscription which are responsible for subscription related crud.

// This controller is used for fetching the Logged-in user's subscription...
export const getMySubscriptions = asyncErrorHandler(async (req, res) => {
  const subscriptions = await Subscription.find({
    subscriber: req.user._id,
  }).populate({
    path: "channel",
    select: "username avatar",
  });

  const channels = subscriptions.map((subscription) => subscription.channel);

  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Subscriptions fetched successfully"));
});

export const toggleSubscription = asyncErrorHandler(async (req, res) => {
  const {channelId} = req.params;
  const subscriberId = req.user._id;

  // Validate channel id
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }

  // Check whether channel exists
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }

  // Prevent self subscription
  if (subscriberId.equals(channel._id)) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  // Check if already subscribed
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  let isSubscribed;
  let updatedChannel;

  if (existingSubscription) {
    // Unsubscribe
    await existingSubscription.deleteOne();

    updatedChannel = await User.findByIdAndUpdate(
      channelId,
      {
        $inc: {
          subscribersCount: -1,
        },
      },
      {
        new: true,
      }
    );

    isSubscribed = false;
  } else {
    // Subscribe
    await Subscription.create({
      subscriber: subscriberId,
      channel: channelId,
    });

    updatedChannel = await User.findByIdAndUpdate(
      channelId,
      {
        $inc: {
          subscribersCount: 1,
        },
      },
      {
        new: true,
      }
    );

    isSubscribed = true;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isSubscribed,
        subscribersCount: updatedChannel.subscribersCount,
      },
      isSubscribed
        ? "Channel subscribed successfully."
        : "Channel unsubscribed successfully."
    )
  );
});
