import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import getMySubscriptions from "../controllers/subscription.controller.js";
const router = Router();

router.route("/").get(verifyJWT, getMySubscriptions);

export default router;
