import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import {Subscription} from "../models/subscription.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
// This controllers are of subscription which are responsible for subscription related crud.

// This controller is used for fetching the Logged-in user's subscription...
const getMySubscriptions = asyncErrorHandler(async (req, res) => {
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

export default getMySubscriptions;
