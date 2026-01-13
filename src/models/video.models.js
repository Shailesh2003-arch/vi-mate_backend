import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    videoFile: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {timestamps: true}
);

// this plugin is only to be used on schemas on which you want to apply aggregation and pagination.
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
