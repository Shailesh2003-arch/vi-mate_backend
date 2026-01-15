import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";

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

export {registerUser};
