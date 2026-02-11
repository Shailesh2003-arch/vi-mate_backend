import redis from "../config/redis.js";
import { Video } from "../models/video.models.js";


// this is a worker which will synchronise the viewscount inside our DB from redis.
// And this worker needs to do his job every 1 minute.
export const syncViewsToDB = async ()=>{
    // its said to avoid redis.keys API in prod.
    const keys = await redis.keys("video:*:views");
    for (const key of keys) {
    const views = await redis.getset(key, 0);

    if (views > 0) {
      const videoId = key.split(":")[1];

      await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: Number(views) } }
      );
    }
  }

  console.log("View sync completed");
}