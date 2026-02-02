import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  publishVideo,
  updateVideoDetails,
} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.js";

const router = Router();
router.use(verifyJWT);

router.route("/publish").post(
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router
  .route("/vid/:videoId")
  .patch(upload.single("thumbnail"), updateVideoDetails);

router.route("/vid/:videoId").delete(deleteVideo);
export default router;
