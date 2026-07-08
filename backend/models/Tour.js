import mongoose from "mongoose";

// The five cultural & heritage cities CityMate covers.
export const CITIES = ["Kathmandu", "Bhaktapur", "Patan", "Pokhara", "Lumbini"];

/*
  A Tour is one bookable city tour shown on the Tours page.
  Admins create these from the admin dashboard.
*/
const tourSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    city: { type: String, required: true, enum: CITIES },
    description: { type: String, required: true, trim: true },

    // How long the tour takes, in hours (e.g. 3).
    durationHours: { type: Number, required: true, min: 1 },

    // Price per person in Nepali rupees. 0 means free.
    price: { type: Number, required: true, min: 0 },

    // Short selling points shown on the tour card (e.g. "Durbar Square").
    highlights: { type: [String], default: [] },

    // Picture shown on the tour card ("/api/uploads/..." or empty for none).
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Tour", tourSchema);
