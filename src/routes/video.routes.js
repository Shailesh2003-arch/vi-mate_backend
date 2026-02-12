import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getFeedVideos,
  getVideoById,
  publishVideo,
  updateVideoDetails,
} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.js";
import { watchVideo } from "../controllers/video.controller.js";
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

router.route("/").get(getFeedVideos);
router.route("/:videoId/view").post(watchVideo);
router.route("/vid/:videoId").get(getVideoById).delete(deleteVideo);
export default router;
