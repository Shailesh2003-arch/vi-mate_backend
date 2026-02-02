import {Router} from "express";
import {generateResetPasswordToken} from "../controllers/auth.controller.js";

const router = Router();

router.route("/forgot-password").post(generateResetPasswordToken);

export default router;
