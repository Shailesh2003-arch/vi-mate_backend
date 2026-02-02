import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiError from "./utils/ApiError.js";

const app = express();

app.use(
  // we setup this cors so that our backend is accessible to only these domains.
  cors({
    origin: process.env.CORS_ORIGIN,
    //   credential true says that - client app - its safe to send the cookies to this domain.
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());

// importing router...

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import authRouter from "./routes/auth.routes.js";
// declaring routes...
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/auth", authRouter);
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  } else {
    console.error(err); // Log the error for internal debugging
    res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
});

export default app;
