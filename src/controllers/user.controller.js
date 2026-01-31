import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";
import generateAccessAndRefreshToken from "../utils/generateAccessAndRefreshTokens.js";
import jwt from "jsonwebtoken";
import uploadOnCloudinary from "../services/cloudinary.js";
import {v2 as cloudinary} from "cloudinary";
import {DEFAULT_AVATAR_URL, DEFAULT_COVER_IMAGE_URL} from "../constants.js";

const registerUser = asyncErrorHandler(async (req, res) => {
  let {username, email, fullName, password} = req.body;
  email = email.toLowerCase().trim();
  username = username.toLowerCase().trim();
  const requiredFields = {
    username,
    email,
    fullName,
    password,
  };

  // we always do data validation on the server side, and dont trust the client-side.
  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      throw new ApiError(400, `${field} is required`);
    }
  }

  const userExists = await User.findOne({
    $or: [{username}, {email}],
  });

  if (userExists) {
    throw new ApiError(409, "User already exists!");
  }

  const createUser = await User.create({
    email,
    password,
    fullName,
    username,
  });

  const createdUser = await User.findById(createUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created Successfully"));
});

const loginUser = asyncErrorHandler(async (req, res) => {
  let {email, password} = req.body;
  email = email.toLowerCase().trim();
  password = password.trim();

  const required_fields = {
    email,
    password,
  };

  for (const [field, value] of Object.entries(required_fields)) {
    if (!value) {
      throw new ApiError(400, `${field} is required`);
    }
  }

  const user = await User.findOne({email});
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          loggedInUser,
        },
        "User logged-in Successfully"
      )
    );
});

const logoutUser = asyncErrorHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {refreshToken: 1},
    },
    {new: true}
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged-out successfully"));
});

const refreshAccessToken = asyncErrorHandler(async (req, res) => {
  const incomingRefreshToken = req?.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedRefreshToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(
    user._id
  );
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, null, "Acess token refreshed successfully"));
});

const changeCurrentPassword = asyncErrorHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body;
  const requiredFields = {
    oldPassword,
    newPassword,
  };

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      throw new ApiError(400, `${field} is required`);
    }
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false});

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

// for frontend make sure that you prefer the exact same way of taking the information.
const updateUserDetails = asyncErrorHandler(async (req, res) => {
  let {email, fullName} = req.body;

  if (!email && !fullName) {
    throw new ApiError(400, "At least email or password is required");
  }

  const updateFields = {};

  if (email) {
    email = email.toLowerCase().trim();

    // Optional: email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    // Check if email already exists
    const emailExists = await User.findOne({email});
    if (emailExists) {
      throw new ApiError(409, "Email already in use");
    }

    updateFields.email = email;
  }

  if (fullName) {
    // Check if email already exists
    const existing_fullName = await User.findOne({fullName});
    if (existing_fullName) {
      throw new ApiError(409, "Email already in use");
    }

    updateFields.fullName = fullName;
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updateFields,
    },
    {
      new: true,
      runValidators: true,
      select: "-password -refreshToken",
    }
  );

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "User credentials updated successfully")
    );
});

// controller for uploading avatar.

const updateAvatar = asyncErrorHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);
  if (!uploadedAvatar?.url) {
    throw new ApiError(400, "Error uploading Avatar file");
  }
  const updatedUserAvatar = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: {
          url: uploadedAvatar.url,
          public_id: uploadedAvatar.public_id,
        },
      },
    },
    {
      new: true,
    }
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {avatar: updatedUserAvatar.avatar.url},
        "Avatar updated successfully"
      )
    );
});

const updateCoverImage = asyncErrorHandler(async (req, res) => {
  const coverImageLocalFilePath = req.file?.path;
  if (!coverImageLocalFilePath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const user = User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.coverImage?.public_id) {
    await cloudinary.uploader.destroy(user.coverImage?.public_id);
  }

  const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalFilePath);
  if (!uploadedCoverImage?.url) {
    throw new ApiError(400, "Error uploading Cover Image file");
  }

  const updatedUserCoverImage = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: {
          url: uploadedCoverImage.url,
          public_id: uploadedCoverImage.public_id,
        },
      },
    },
    {
      new: true,
    }
  );
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {coverImage: updatedUserCoverImage.url},
        "Cover Image updated successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
};
