import {User} from "../models/user.models.js";
import ApiError from "./ApiError.js";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});
    return {accessToken, refreshToken};
  } catch (error) {
    console.error("Error generating access and refresh token", error);
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};

export default generateAccessAndRefreshToken;
