import mongoose from "mongoose";

const inzeratChangeRequestSchema = new mongoose.Schema({
  inzeratId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "inzerat",
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  newData: {
    type: Object, // jen změněná pole
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const inzeratChangeRequestModel = mongoose.models.InzeratChangeRequest || mongoose.model('InzeratChangeRequest', inzeratChangeRequestSchema);
export default inzeratChangeRequestModel;