import dns from "dns";
dns.setServers(['8.8.8.8', '1.1.1.1']);
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import app from "./src/app.js";

import { syncViewsToDB } from "./src/workers/viewSync.Worker.js";
import cron from "node-cron";
dotenv.config({path: "./.env"});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`ERROR starting the express application`, error);
    });
    app.listen(process.env.PORT, () => {
      console.log(`Server started listening on Port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`ERROR connecting to MongoDB`, err);
  });

cron.schedule("*/1 * * * *", async () => {
  await syncViewsToDB();
});