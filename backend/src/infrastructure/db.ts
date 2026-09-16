import mongoose from "mongoose";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
  const MONGODB_URL = process.env.MONGODB_URL;
  if (!MONGODB_URL) {
  console.log("Error connecting to the database...");
    console.log(new Error("MONGODB_URL is not set"));
    return;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await mongoose.connect(MONGODB_URL);
      console.log("Connected to the database...");
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.log("Error connecting to the database...");
        console.log(error);
        return;
      }

      const reason = error instanceof Error ? error.message.split("\n")[0] : error;
      console.log(
        `Database connection attempt ${attempt}/${MAX_ATTEMPTS} failed (${reason}), ` +
          `retrying in ${RETRY_DELAY_MS / 1000}s...`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDB;
