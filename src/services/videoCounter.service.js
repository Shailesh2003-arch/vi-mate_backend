import redis from "../config/redis.js";
import {videoCounterKey, videoViewsKey} from "../utils/redis/rediskeys.js";

export const incrementVideoView = async (videoId, userId) => {
  const dedupeKey = videoViewsKey(videoId, userId);
  // this checks if the user has watched the video in last 24 hrs, if not it sets the key which expires after 24 hrs
  // and then we increment the view counter.
  const result = await redis.set(dedupeKey, "1", "NX", "EX", 86400);
  if (result) {
    await redis.incr(videoCounterKey(videoId));
  }
};
