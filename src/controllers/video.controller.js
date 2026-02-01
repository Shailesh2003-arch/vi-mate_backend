import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import {Video} from "../models/video.models.js";
import uploadOnCloudinary from "../services/cloudinary.js";

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
      await cloudinary.uploader.destroy;
      uploadedThumbnail.public_id;
    }
    throw new ApiError(500, "Media upload failed");
  }

  const videoDuration = uploadedVideoFile.duration;
  const durationInMinutes = parseFloat((videoDuration / 60).toFixed(2));

  const publishedVideo = await Video.create({
    title,
    description,
    thumbnail: uploadedThumbnail.url,
    videoFile: uploadedVideoFile.url,
    duration: durationInMinutes,
    owner: req.user?._id,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        id: publishVideo._id,
        title: publishedVideo.title,
        thumbnail: publishedVideo.thumbnail,
        duration: publishedVideo.duration,
      },
      "Video Published Successfully"
    )
  );
});

export {publishVideo};
