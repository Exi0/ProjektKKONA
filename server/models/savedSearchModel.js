import mongoose from "mongoose";

const savedSearchSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, index: true },
  // Uložené filtry (všechny volitelné — prázdné = "vše")
  name: { type: String, default: "", maxlength: 100 },
  kategorie: { type: String, default: "" },
  ukon: { type: String, default: "" },
  kraj: { type: String, default: "" },
  search: { type: String, default: "" },
  minCena: { type: Number, default: null },
  maxCena: { type: Number, default: null },
  // Kdy jsme naposledy matchli a notifikovali
  lastNotifiedAt: { type: Date, default: Date.now },
  // E-mail alert zapnutý?
  alertEnabled: { type: Boolean, default: true },
}, { timestamps: true });

// Max 10 uložených hledání na uživatele (ochrana proti zneužití)
savedSearchSchema.index({ user: 1, createdAt: 1 });

const savedSearchModel =
  mongoose.models.savedSearch || mongoose.model("savedSearch", savedSearchSchema);

export default savedSearchModel;
