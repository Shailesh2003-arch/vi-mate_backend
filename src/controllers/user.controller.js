import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";
import generateAccessAndRefreshToken from "../utils/generateAccessAndRefreshTokens.js";

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
  const user = req.user;

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {refreshToken: undefined},
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

export {registerUser, loginUser, logoutUser};
