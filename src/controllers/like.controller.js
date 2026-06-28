import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import {Video} from "../models/video.models.js";
import {
  dirtyVideosKey,
  likesDeltaKey,
  dislikesDeltaKey,
  userReactionKey,
} from "../utils/redis/redisKeys.js";
import redis from "../config/redis.js";

const toggleVideoReaction = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const userId = req.user._id;
  const {type} = req.body;

  if (!["like", "dislike"].includes(type)) {
    throw new ApiError(400, "Invalid reaction type");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const reactionKey = userReactionKey(videoId, userId);
  const likesKey = likesDeltaKey(videoId);
  const dislikesKey = dislikesDeltaKey(videoId);
  const dirtyKey = dirtyVideosKey();

  const currentReaction = await redis.get(reactionKey);

  const multi = redis.multi();

  let updatedReaction = currentReaction;

  // CASE 1 : First reaction
  if (!currentReaction) {
    multi.incr(type === "like" ? likesKey : dislikesKey);
    multi.set(reactionKey, type);

    updatedReaction = type;
  }

  // CASE 2 : Toggle OFF
  else if (currentReaction === type) {
    multi.decr(type === "like" ? likesKey : dislikesKey);
    multi.del(reactionKey);

    updatedReaction = null;
  }

  // CASE 3 : Switch reaction
  else {
    multi.decr(currentReaction === "like" ? likesKey : dislikesKey);
    multi.incr(type === "like" ? likesKey : dislikesKey);
    multi.set(reactionKey, type);

    updatedReaction = type;
  }

  // Mark video dirty
  multi.sadd(dirtyKey, videoId);

  await multi.exec();

  // 5. Latest counts
  const [likesDelta, dislikesDelta] = await Promise.all([
    redis.get(likesKey),
    redis.get(dislikesKey),
  ]);

  const latestLikes = video.likes + (parseInt(likesDelta) || 0);

  const latestDislikes = video.dislikes + (parseInt(dislikesDelta) || 0);

  // 6. Response
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userReaction: updatedReaction,
        likes: latestLikes,
        dislikes: latestDislikes,
      },
      "Reaction updated successfully."
    )
  );
});

export {toggleVideoReaction};
