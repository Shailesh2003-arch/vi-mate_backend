import redis from "../config/redis.js";
import { videoViewsKey } from "../utils/redis/rediskeys.js";

export const incrementVideoView = async(videoId)=>{
    const key = videoViewsKey(videoId);
    await redis.incr(key);
}