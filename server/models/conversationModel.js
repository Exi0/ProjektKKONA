// models/conversationModel.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    inzerat: { type: mongoose.Schema.Types.ObjectId, ref: "inzerat", required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    lastMessage: { type: String, default: "" },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const conversationModel = mongoose.models.conversation || mongoose.model("conversation", conversationSchema);
export default conversationModel;
