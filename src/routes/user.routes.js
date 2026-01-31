import {Router} from "express";
import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserDetails,
  updateAvatar,
  updateCoverImage,
} from "../controllers/user.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.js";
const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/change-credential").post(verifyJWT, updateUserDetails);
router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
router.route(
  "/update-cover-image",
  upload.single("coverImage"),
  updateCoverImage
);

export default router;
