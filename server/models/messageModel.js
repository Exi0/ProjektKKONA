// models/messageModel.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }]
  },
  { timestamps: true }
);

const messageModel = mongoose.models.message || mongoose.model("message", messageSchema);
export default messageModel;
