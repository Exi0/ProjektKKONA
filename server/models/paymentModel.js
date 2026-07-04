import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },

  type: {
    type: String,
    enum: ["unlock_profile", "subscription"],
    required: true
  },

  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    default: null
  },

  amount: { type: Number, required: true },
  currency: { type: String, default: "CZK" },

  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending"
  },

  provider: { type: String, default: "stripe" },
  providerPaymentId: { type: String, default: null },

}, { timestamps: true });

const paymentModel = mongoose.models.payment || mongoose.model("payment", paymentSchema);

export default paymentModel;
