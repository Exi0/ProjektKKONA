import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  nazev: { type: String, required: true, trim: true, maxlength: 255 },
  path: { type: String, required: true },
  inzerat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'inzerats',
    required: false, // ⬅️ make it optional
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: false, // ⬅️ allow linking image to user instead of inzerat
  },
  category: { type: String, default: null },
  approved: { type: Boolean, default: false },
});

const imageModel = mongoose.models.image || mongoose.model('image', imageSchema);
export default imageModel;
