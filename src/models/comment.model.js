import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    // Comment text
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: 1000,
    },

    // Video on which this comment belongs
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    // User who wrote the comment
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // These are just counters
    // Actual reactions will be stored separately
    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    // Total replies count
    // Actual replies will be in Reply collection
    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({
  video: 1,
  createdAt: -1,
});

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);
