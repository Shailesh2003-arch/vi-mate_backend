import mongoose, {Schema} from "mongoose";

const likeSchema = new Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {timestamps: true}
);

likeSchema.index({likedBy: 1, video: 1}, {unique: true});
export const Like = mongoose.model("Like", likeSchema);
