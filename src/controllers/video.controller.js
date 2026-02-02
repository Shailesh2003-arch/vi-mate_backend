import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {Video} from "../models/video.models.js";
import uploadOnCloudinary from "../services/cloudinary.js";
import {v2 as cloudinary} from "cloudinary";

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
    uploadedThumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
    uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath);
  } catch (error) {
    if (uploadedThumbnail?.public_id) {
      await cloudinary.uploader.destroy(uploadedThumbnail.public_id);
    }
    throw new ApiError(500, "Media upload failed");
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
        id: publishVideo._id,
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

export {publishVideo, updateVideoDetails, deleteVideo};
