import mongoose from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dv2miz7hz/image/upload/v1767777012/default-avatar.png_cxobtu.png",
    },
    coverImage: {
      type: String,
      default:
        "https://res.cloudinary.com/dv2miz7hz/image/upload/v1767775630/samples/landscapes/landscape-panorama.jpg",
    },
    subscribersCount: {
      type: Number,
      default: 0,
    },
    watchHistory: [
      {
        video: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        //   this watchedAt gets triggered when you push a video into the user's watch-history from a controller (when an API is hit)
        watchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiry: {
      type: Date,
    },
    refreshToken: {
      type: String,
    },
  },
  {timestamps: true}
);

// this means that - make the model as well as also export it, so we can use it in another files.
// as soon as the database gets connected, these files directly get connected and they form the collection and then the data is stored inside the collection.
export const User = mongoose.model("user", usersSchema);
