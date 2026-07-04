// models/inzeratModel.js
import mongoose from "mongoose";

const inzeratSchema = new mongoose.Schema({
  nadpis: { type: String, required: true, trim: true, maxlength: 255 },
  popis: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'images' }],
  kategorie: {
    type: String,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  ukon: {
    type: String,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  stat: {
    type: String,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  kraj: {
    type: String,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  mesto: {
    type: String,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  cenaPerHa: {
    type: Number,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  ha: {
    type: Number,
    required: function() { return this.stav !== 'Rozpracovaný'; }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: function() { return this.stav !== 'Rozpracovaný'; }
    }
  },
  cenaType: { type: String, enum: ['ha', 'h', 't', 'kg'], default: 'ha' },

  // ✅ ZMĚNA: rozšířený enum stavů o fáze deal lifecycle
  stav: {
    type: String,
    enum: [
      'Rozpracovaný',
      'Čeká na schválení',
      'Veřejný',
      'Domluveno',     // ← NOVÉ: vítěz vybrán, čeká se na potvrzení podmínek
      'Probíhá',       // ← NOVÉ: obě strany potvrdily, práce probíhá
      'Čeká na potvrzení dokončení', // ← NOVÉ: dodavatel hlásí hotovo
      'Dokončeno',     // ← NOVÉ: objednatel potvrdil dokončení → odemčeno hodnocení
      'Sporný',        // ← NOVÉ: jedna strana nahlásila problém
      'Ukončený',
    ],
    default: 'Rozpracovaný',
    required: true
  },
  statusHistory: [
    {
      stav: {
        type: String,
        enum: [
          'Rozpracovaný', 'Čeká na schválení', 'Veřejný',
          'Domluveno', 'Probíhá', 'Čeká na potvrzení dokončení',
          'Dokončeno', 'Sporný', 'Ukončený',
        ]
      },
      date: { type: Date, default: Date.now },
      note: { type: String, default: '' },
    }
  ],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", default: [] }],
  interestedUsers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      like: { type: Boolean, default: false },
      readStatus: { type: Boolean, default: false },
    }
  ],
  winner: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },

  // ✅ NOVÉ: deal sub-dokument — podmínky a průběh zakázky
  deal: {
    // Dohodnuté podmínky
    agreedPrice: { type: Number, default: null },         // dohodnutá cena (může se lišit od cenaPerHa)
    agreedDate: { type: Date, default: null },            // dohodnuté datum provedení
    agreedNote: { type: String, default: '', maxlength: 500 }, // poznámka k dohodě

    // Potvrzení obou stran
    winnerConfirmed: { type: Boolean, default: false },   // dodavatel souhlasí s podmínkami
    winnerConfirmedAt: { type: Date, default: null },
    ownerConfirmed: { type: Boolean, default: false },    // objednatel souhlasí s podmínkami
    ownerConfirmedAt: { type: Date, default: null },

    // Dokončení
    markedCompleteBy: { type: String, enum: ['winner', 'owner', null], default: null },
    markedCompleteAt: { type: Date, default: null },
    completionConfirmedBy: { type: String, enum: ['winner', 'owner', null], default: null },
    completionConfirmedAt: { type: Date, default: null },

    // Hodnocení (kdo už hodnotil v rámci TOHOTO dealu)
    ownerRated: { type: Boolean, default: false },
    winnerRated: { type: Boolean, default: false },

    // Spor
    disputeReason: { type: String, default: '', maxlength: 500 },
    disputeBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    disputeAt: { type: Date, default: null },
  },

  tags: [{ type: String }],
  deadline: { type: Date },
  views: { type: Number, default: 0 },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  }],
  rating: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    value: { type: Number, min: 1, max: 5 },
    comment: String
  }]
}, {
  timestamps: true
});

inzeratSchema.index({ location: "2dsphere" });
inzeratSchema.index({ stav: 1, createdAt: -1 });
inzeratSchema.index({ stav: 1, kategorie: 1, ukon: 1 });
inzeratSchema.index({ stav: 1, kraj: 1 });
inzeratSchema.index({ stav: 1, cenaPerHa: 1 });

const inzeratModel = mongoose.models.inzerat || mongoose.model('inzerat', inzeratSchema);
export default inzeratModel;
