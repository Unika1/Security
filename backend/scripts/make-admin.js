import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

/*
  Promote an existing account to admin. Run from the backend folder:

    npm run make-admin -- your@email.com

  (The account must already be registered on the site.)
*/

const email = process.argv[2];
if (!email) {
  console.log("Usage: npm run make-admin -- your@email.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const user = await User.findOneAndUpdate(
  { email: email.toLowerCase().trim() },
  { role: "admin" },
  { new: true }
);

if (user) {
  console.log(`${user.email} is now an admin.`);
} else {
  console.log(`No account found for "${email}". Register on the site first, then run this again.`);
}

await mongoose.disconnect();
