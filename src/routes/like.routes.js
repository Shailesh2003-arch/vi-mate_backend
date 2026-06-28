import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";
import {toggleVideoReaction} from "../controllers/like.controller.js";
const router = Router();

router.use(verifyJWT);
router.route("/:videoId/reaction").post(verifyJWT, toggleVideoReaction);

export default router;
