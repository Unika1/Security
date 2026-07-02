import mongoose from "mongoose";

// Connect to MongoDB once when the server starts.
export default async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env");
  }
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}
