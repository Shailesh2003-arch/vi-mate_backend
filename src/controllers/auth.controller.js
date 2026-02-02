import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncErrorHandler from "../utils/asyncErrorHandler.js";
import {User} from "../models/user.models.js";
import {generateResetToken} from "../utils/generateResetToken.js";
import {sendResetPasswordEmail} from "../services/email/resetPassword.email.js";

// [LookAtMe]
// Setting-up the domain is required, for testing in dev environment my email is provided.
export const generateResetPasswordToken = asyncErrorHandler(
  async (req, res) => {
    const {email} = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({email});

    // anti-enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link will be sent",
      });
    }
    const {rawToken, hashedToken, expiresAt} = generateResetToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expiresAt;

    await user.save({validateBeforeSave: false});
    // 🔗 build link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    await sendResetPasswordEmail({
      to: user.email,
      name: user.fullName,
      resetLink,
    });
    return res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  }
);
