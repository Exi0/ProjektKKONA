import mongoose from "mongoose";

const profileChangeRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  newData: {
    type: Object,
    required: true
  },
  avatarTemp: { type: String, default: null },
  backgroundTemp: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("ProfileChangeRequest", profileChangeRequestSchema);
