import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `Database you're connected to is ${connectionInstance.connection.name} and the connection is in state ${connectionInstance.connection.readyState}`
    );
  } catch (error) {
    console.log(`ERROR Connecting to MongoDB`, error);
    process.exit(1);
  }
};

export default connectDB;
