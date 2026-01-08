import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
export default app;
