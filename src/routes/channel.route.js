import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getChannelDetails,
  getChannelVideos,
} from "../controllers/channel.controller.js";
const router = Router();

router.route("/:channelId").get(verifyJWT, getChannelDetails);
router.route("/:channelId/videos").get(verifyJWT, getChannelVideos);
export default router;
