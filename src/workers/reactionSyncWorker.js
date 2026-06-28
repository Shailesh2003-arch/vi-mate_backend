import {Video} from "../models/video.models.js";
import {
  likesDeltaKey,
  dislikesDeltaKey,
  dirtyVideosKey,
} from "../utils/redis/redisKeys.js";
import redis from "../config/redis.js";

export const syncVideoReactions = async () => {
  const dirtyKey = dirtyVideosKey();

  const videoIds = await redis.smembers(dirtyKey);

  for (const videoId of videoIds) {
    try {
      const likesDelta = parseInt(await redis.get(likesDeltaKey(videoId))) || 0;

      const dislikesDelta =
        parseInt(await redis.get(dislikesDeltaKey(videoId))) || 0;

      // If nothing to sync, just clean dirty entry
      if (likesDelta === 0 && dislikesDelta === 0) {
        await redis.srem(dirtyKey, videoId);
        continue;
      }

      // Persist changes to Mongo
      await Video.findByIdAndUpdate(videoId, {
        $inc: {
          likes: likesDelta,
          dislikes: dislikesDelta,
        },
      });

      // Clear delta counters
      await redis.del(likesDeltaKey(videoId));
      await redis.del(dislikesDeltaKey(videoId));

      // Remove from dirty set
      await redis.srem(dirtyKey, videoId);
    } catch (error) {
      console.error(`Failed syncing reactions for video ${videoId}`, error);
      // DO NOT remove from dirty set if failed
      // So next cron attempt retries
    }
  }
};
