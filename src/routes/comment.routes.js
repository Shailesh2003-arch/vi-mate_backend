import {Router} from "express";
import verifyJWT from "../middlewares/auth.middleware.js";

import {
  createComment,
  deleteComment,
  getCommentsByVideo,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router
  .route("/video/:videoId")
  .get(verifyJWT, getCommentsByVideo)
  .post(verifyJWT, createComment);

// Update a comment
// Delete a comment
router
  .route("/:commentId")
  .patch(verifyJWT, updateComment)
  .delete(verifyJWT, deleteComment);

export default router;
