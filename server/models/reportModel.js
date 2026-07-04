import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const reportModel = mongoose.models.report || mongoose.model("report", reportSchema);
export default reportModel;