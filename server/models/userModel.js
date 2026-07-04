import mongoose from "mongoose";

// ⭐ více-dimenzionální hodnocení
const ratingSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  reliability: { type: Number, required: true, min: 1, max: 5 },   // spolehlivost
  communication: { type: Number, required: true, min: 1, max: 5 }, // komunikace
  quality: { type: Number, required: true, min: 1, max: 5 },       // kvalita služby
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

// ✅ virtuály na průměrné hodnoty
ratingSchema.virtual("average").get(function () {
  return ((this.reliability + this.communication + this.quality) / 3).toFixed(1);
});

const verificationSchema = new mongoose.Schema({
  documentPath: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  uploadedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: {type: String, required:true},
  email: {type: String, required:true,unique:true},
  heslo: {type: String, required:true},
  ico:{type: String, required:true,unique:true},
  verifyOtp: {type: String, default:''},
  verifyOtpExpireAt: {type: Number, default:0},
  verifyOtpAttempts: {type: Number, default:0}, // ✅ počet chybných pokusů o ověření
  isAccountVerified:{type: Boolean, default:false},
  resetOtp:{type: String, default:''},
  resetOtpExpireAt:{type: Number, default:0},
  resetOtpAttempts:{type: Number, default:0}, // ✅ počet chybných pokusů o reset hesla
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // ✅ New fields for profile editing
  phone: { type: [String], default: [] },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  avatarPath: { type: String, default: '' },
  backgroundPath: { type: String, default: '' },

  // ⭐ Ratings from other users
  ratings: { type: [ratingSchema], default: [] },

  // 💚 kdo si tohoto uživatele přidal do oblíbených
  favoritedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', default: [] }],

  // ✅ Specializace (pole kategorií z inzerátů)
  specializace: { type: [String], default: [] },
  // ✅ Subscription
  subscription: {
    hasSubscription: { type: Boolean, default: false },
    // ✅ FIX: doplněno "premium" – webhook zapisuje type: "premium",
    // ale enum ho dosud nepovoloval (frontend kontroluje sub.type === "premium")
    type: { type: String, enum: ["none", "basic", "premium"], default: "none" },
    expiresAt: { type: Date, default: null },
    stripeSubscriptionId: {type: String, default:''}
  },
  unlockedProfiles: {
  type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  default: []
},
  // Verifikace
  isVerified: { type: Boolean, default: false },
  verification: { type: verificationSchema, default: null },
},{ timestamps: true }); // 👈 Tohle je zásadní

// ===== Virtuály pro agregované průměry =====
userSchema.virtual("averageRatings").get(function () {
  if (!this.ratings.length) {
    return { reliability: 0, communication: 0, quality: 0, overall: 0 };
  }
  const sum = this.ratings.reduce(
    (acc, r) => {
      acc.reliability += r.reliability;
      acc.communication += r.communication;
      acc.quality += r.quality;
      return acc;
    },
    { reliability: 0, communication: 0, quality: 0 }
  );
  const count = this.ratings.length;
  return {
    reliability: (sum.reliability / count).toFixed(1),
    communication: (sum.communication / count).toFixed(1),
    quality: (sum.quality / count).toFixed(1),
    overall: ((sum.reliability + sum.communication + sum.quality) / (3 * count)).toFixed(1),
  };
});

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
