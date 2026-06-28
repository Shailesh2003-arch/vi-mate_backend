import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {Video} from "../models/video.models.js";
import uploadOnCloudinary from "../services/cloudinary.js";
import {v2 as cloudinary} from "cloudinary";
import {incrementVideoView} from "../services/videoCounter.service.js";
import {Subscription} from "../models/subscription.model.js";

// controller for publishing a video
// takes time as video is getting uploaded...
const publishVideo = asyncErrorHandler(async (req, res) => {
  let {title, description} = req.body;

  title = title.trim();
  description = description.trim();

  const requiredFields = {
    title,
    description,
  };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      throw new ApiError(400, `${field} is required`);
    }
  }

  if (!req.files?.thumbnail?.length || !req.files?.videoFile?.length) {
    throw new ApiError(400, "Thumbnail and video file are required");
  }

  const thumbnailFileLocalPath = req.files?.thumbnail[0]?.path;
  const videoFileLocalPath = req.files?.videoFile[0]?.path;

  let uploadedThumbnail;
  let uploadedVideoFile;
  // upload media to cloudinary
  try {
    uploadedThumbnail = await uploadOnCloudinary(
      thumbnailFileLocalPath,
      "image"
    );
    uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath, "video");
  } catch (error) {
    if (uploadedThumbnail?.public_id) {
      await cloudinary.uploader.destroy(uploadedThumbnail.public_id);
    }

    throw error; // temporarily throw original error
  }

  const videoDuration = uploadedVideoFile.duration;
  const durationInMinutes = parseFloat((videoDuration / 60).toFixed(2));

  const publishedVideo = await Video.create({
    title,
    description,
    thumbnail: {
      url: uploadedThumbnail.url,
      public_id: uploadedThumbnail.public_id,
    },
    videoFile: {
      url: uploadedVideoFile.url,
      public_id: uploadedVideoFile.public_id,
    },
    duration: durationInMinutes,
    owner: req.user?._id,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: publishedVideo._id,
        title: publishedVideo.title,
        thumbnail: publishedVideo.thumbnail?.url,
        duration: publishedVideo.duration,
      },
      "Video Published Successfully"
    )
  );
});

// controller for updating video details.
const updateVideoDetails = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  let updatableEntities = {};
  if ("title" in req.body) {
    const title = req.body.title.trim();
    if (!title) {
      throw new ApiError(400, "title cant be empty");
    }
    updatableEntities.title = title;
  }
  if ("description" in req.body) {
    const description = req.body.description.trim();
    if (!description) {
      throw new ApiError(400, "description cant be empty");
    }
    updatableEntities.description = description;
  }

  if (req.file) {
    const thumbnailFileLocalPath = req.file?.path;
    try {
      if (video.thumbnail?.public_id) {
        // delete existing thumbnail from cloud.
        await cloudinary.uploader.destroy(video.thumbnail?.public_id);
      }
      // upload new thumbnail to the cloud.
      const uploadedThumbnail = await uploadOnCloudinary(
        thumbnailFileLocalPath
      );
      if (!uploadedThumbnail.url) {
        throw new ApiError(500, "Thumbnail upload failed");
      }
      updatableEntities.thumbnail = {
        url: uploadedThumbnail.url,
        public_id: uploadedThumbnail.public_id,
      };
    } catch (error) {
      throw new ApiError(
        error.http_code || 500,
        error.message || "failed to upload thumbnail"
      );
    }
  }
  if (Object.keys(updatableEntities).length === 0) {
    throw new ApiError(400, "No valid fields provided to update");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {$set: updatableEntities},
    {new: true}
  );
  res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

// controller for deleting video.
const deleteVideo = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  // cheapest, fastest, lowest-risk task first...
  try {
    if (video.thumbnail?.public_id) {
      await cloudinary.uploader.destroy(video.thumbnail.public_id);
    }
    if (video.videoFile?.public_id) {
      await cloudinary.uploader.destroy(video.videoFile.public_id, {
        resource_type: "video",
      });
    }
  } catch (error) {
    throw new ApiError(
      error.http_code || 500,
      error.message || "failed to upload thumbnail"
    );
  }
  await video.deleteOne();
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const getVideoById = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const video = await Video.findById(videoId).populate(
    "owner",
    "username avatar.url subscribersCount"
  );
  const isSubscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: video.owner._id,
  });
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const streamUrl = cloudinary.url(video.videoFile.public_id, {
    resource_type: "video",
    streaming_profile: "auto",
    format: "m3u8",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        streamUrl,
        video: {
          _id: video._id,
          title: video.title,
          description: video.description,
          duration: video.duration,
          views: video.views,
          createdAt: video.createdAt,
        },
        channel: {
          _id: video.owner._id,
          name: video.owner.username,
          avatar: video.owner.avatar.url,
          subscribersCount: video.owner.subscribersCount,
          isSubscribed: !!isSubscribed,
        },
      },
      "Video ready to stream"
    )
  );
});

// get video feed...

// Now this will be a read-heavy API - so there will be a lot of data coming in.
// We can handle it by using one of the design patterns.
// 1) Pagination - data is served in chunks.
// 2) Database-replicas - Read-heavy operation if needs to performed, then we can maintain separate copy of the database (slave-databse).
// 3) Caching - If this is a frequently accessed data, then we can implement a cache.
// 4) Load balancers - we need to implement this in-order to maintain number of request.

const getFeedVideos = asyncErrorHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const skip = (page - 1) * limit;

  const sortType = req.query.sort === "popular" ? {views: -1} : {createdAt: -1}; // default: latest
  const videos = await Video.find({})
    .sort(sortType)
    .skip(skip)
    .limit(limit)
    .select("title thumbnail.url duration views owner createdAt")
    .populate("owner", "username avatar.url")
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        page,
        limit,
        count: videos.length,
        videos,
      },
      "Videos fetched successfully"
    )
  );
});

// this will increment the count inside the Redis...
// this controller will be hit from frontend when frontend hits /api/videos/:id/view
const watchVideo = asyncErrorHandler(async (req, res) => {
  const {videoId} = req.params;
  const userId = req.user._id;
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  await incrementVideoView(videoId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "View Registered Successfully"));
});

export {
  publishVideo,
  updateVideoDetails,
  deleteVideo,
  getVideoById,
  getFeedVideos,
  watchVideo,
};
