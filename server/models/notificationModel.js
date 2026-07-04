import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // komu notifikace patří
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true,
  },




  
  // typ události — umožňuje frontendové ikony a filtrování
  type: {
    type: String,
    enum: [
      "new_interest",       // někdo projevil zájem o váš inzerát
      "interest_removed",   // někdo odebral zájem
      "winner_selected",    // byli jste vybráni jako vítěz
      "new_message",        // nová zpráva v konverzaci
      "inzerat_approved",   // váš inzerát byl schválen (publikován)
      "inzerat_rejected",   // váš inzerát byl zamítnut
      "image_approved",     // váš obrázek byl schválen
      "image_rejected",     // váš obrázek byl zamítnut
      "profile_verified",   // váš profil byl ověřen
      "system",             // systémová zpráva
    ],
    required: true,
  },
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 500 },
  // odkaz, kam notifikace vede (např. "/inzerat/abc123")
  link: { type: String, default: "" },
  read: { type: Boolean, default: false, index: true },
}, {
  timestamps: true,
});

// Složený index pro rychlé dotazy: "nepřečtené notifikace uživatele X, nejnovější první"
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const notificationModel =
  mongoose.models.notification || mongoose.model("notification", notificationSchema);

export default notificationModel;