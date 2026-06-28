import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
  getMySubscriptions,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
const router = Router();

router.route("/").get(verifyJWT, getMySubscriptions);
router.route("/:channelId").post(verifyJWT, toggleSubscription);

export default router;
