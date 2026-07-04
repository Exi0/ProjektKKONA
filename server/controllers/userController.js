import userModel from "../models/userModel.js";
import imageModel from '../models/imageModel.js';
import fs from 'fs';
// 🔑 validní kategorie (stejné jako v FE)
const kategorieOptions = [
  "Základní zpracování půdy",
  "Předseťová příprava půdy",
  "Setí a výsadba",
  "Aplikace hnojiv a organických látek",
  "Ochrana rostlin",
  "Sklizeň hlavních polních plodin",
  "Sklizeň pícnin a objemných krmiv",
  "Lisování, balení a manipulace",
  "Nakládací technika",
  "Doprava a přeprava",
  "Ostatní technologické služby",
  "Precizní zemědělství",
  "Lesnictví",
];
// ---- helpers -------------------------------------------------
const parsePhones = (raw) => {
  if (raw == null) return null; // "not provided" -> don't change
  // If frontend sends FormData with multiple fields: phone[]=... phone[]=...
  // multer/express can give either array or single string.
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    // allow comma/semicolon separated, or single value
    list = raw.split(/[;,]/);
  } else {
    return null;
  }

  const cleaned = [...new Set(
    list
      .map(v => String(v).trim())
      .filter(v => v.length > 0)
  )];

  return cleaned;
};

// ------------------ UPDATE PROFILE ---------------------------
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'Chybí ID uživatele' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Uživatel nenalezen' });

    const { name, phone, location, description,specializace } = req.body;

    // update fields (only if provided)
    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (location !== undefined) user.location = (location ?? '').toString();
    if (description !== undefined) user.description = (description ?? '').toString();

    // phones: accept array, comma-separated string, or multiple phone[] fields
    const parsed = parsePhones(phone ?? req.body['phone[]']);
    if (parsed !== null) {
      user.phone = parsed; // array (can be empty [])
    }
    // ✅ specializace
    if (specializace !== undefined) {
      let selected = [];
      if (Array.isArray(specializace)) {
        selected = specializace.map((s) => s.toString().trim());
      } else if (typeof specializace === "string") {
        selected = specializace.split(",").map((s) => s.trim());
      }
      // povolíme jen validní kategorie
      user.specializace = selected.filter((s) => kategorieOptions.includes(s));
    }
    // files
    const files = req.files;
    if (files?.avatar?.[0]) {
      const oldAvatar = user.avatarPath;
      user.avatarPath = files.avatar[0].path;
      if (oldAvatar && fs.existsSync(oldAvatar)) fs.unlinkSync(oldAvatar);
    }
    if (files?.background?.[0]) {
      const oldBackground = user.backgroundPath;
      user.backgroundPath = files.background[0].path;
      if (oldBackground && fs.existsSync(oldBackground)) fs.unlinkSync(oldBackground);
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Profil byl aktualizován',
      avatarPath: user.avatarPath?.replace(/\\/g, '/'),
      backgroundPath: user.backgroundPath?.replace(/\\/g, '/'),
      specializace: user.specializace
    });
  } catch (error) {
    console.error('❌ Chyba při aktualizaci profilu:', error);
    return res.status(500).json({ success: false, message: 'Chyba serveru' });
  }
};

// ------------------ GET USER DATA (private) ------------------
export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;  // ✅ místo req.body
     const user = await userModel.findById(userId)

    if (!user) return res.json({ success: false, message: "Uživatel nenalezen" });

    // Always return phone as array
    const phoneArray = Array.isArray(user.phone)
      ? user.phone
      : (typeof user.phone === 'string' && user.phone.trim() ? [user.phone.trim()] : []);

    const gallery = await imageModel.find({
      user: userId,
      inzerat: null,
      category: { $ne: null }
    }).select('path nazev category approved');
    //console.log(user)
    return res.json({
      success: true,
      userData: {
        name: user.name,
        id: user._id,
        email: user.email,
        ico: user.ico,
        isAccountVerified: user.isAccountVerified,
        location: user.location,
        description: user.description,
        phone: phoneArray,
        avatarPath: user.avatarPath,
        backgroundPath: user.backgroundPath,
        role:user.role,
        specializace: user.specializace,
        gallery: gallery.map((img) => ({
          _id: img._id,
          path: img.path.replace(/\\/g, '/'),
          nazev: img.nazev,
          category: img.category,
          approved: img.approved
        })),
        subscription:user.subscription,
        unlockedProfiles: user.unlockedProfiles
      }
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// 📌 Přidání hodnocení s více kategoriemi
export const addRating = async (req, res) => {
  // ⚠️ Upozornění: tato starší cesta k hodnocení zůstává funkční,
    // ale pro hodnocení v rámci zakázky použij /api/deal/rate (ten
    // kontroluje, že deal je "Dokončeno" a že strana ještě nehodnotila).
    // Pokud chceš starou cestu úplně zablokovat, odkomentuj:
    return res.status(400).json({
      success: false,
      message: "Hodnocení je nyní možné pouze přes dokončenou zakázku"
    });
  try {
    const { userId } = req.params; // ID profilu, který hodnotíme
    const { reliability, communication, quality, comment } = req.body;
    const fromUserId = req.userId; // přihlášený uživatel z middleware

    // ✅ validace vstupů
    if (![reliability, communication, quality].every(v => v >= 1 && v <= 5)) {
      return res.json({ success: false, message: "Neplatné hodnocení (1–5 ⭐)" });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "Uživatel nenalezen" });

    // přidej nový rating
    user.ratings.push({
      from: fromUserId,
      reliability,
      communication,
      quality,
      comment,
      createdAt: new Date(),
    });

    await user.save();

    // načti znovu s populate
    const populatedUser = await userModel
      .findById(userId)
      .populate("ratings.from", "name email avatarPath");

    // výpočet průměrů
    const count = populatedUser.ratings.length;
    const avgRatings = {
      reliability: (populatedUser.ratings.reduce((s, r) => s + (r.reliability || 0), 0) / count).toFixed(1),
      communication: (populatedUser.ratings.reduce((s, r) => s + (r.communication || 0), 0) / count).toFixed(1),
      quality: (populatedUser.ratings.reduce((s, r) => s + (r.quality || 0), 0) / count).toFixed(1),
    };

    // celkový průměr (ze všech tří kategorií)
    const overall = (
      populatedUser.ratings.reduce(
        (s, r) =>
          s +
          ((r.reliability || 0) + (r.communication || 0) + (r.quality || 0)) / 3,
        0
      ) / count
    ).toFixed(1);

    res.json({
      success: true,
      message: "Hodnocení přidáno",
      ratings: populatedUser.ratings,
      averageRatings: { ...avgRatings, overall },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


// ✅ Získání hodnocení uživatele
export const getRatings = async (req, res) => {
  try {
    const { userId } = req.query;

    const user = await userModel
      .findById(userId)
      .populate("ratings.from", "name avatarPath email");

    if (!user) {
      return res.json({ success: false, message: "Uživatel nenalezen" });
    }

    const count = user.ratings.length;
    if (count === 0) {
      return res.json({
        success: true,
        ratings: [],
        averageRatings: { reliability: 0, communication: 0, quality: 0, overall: 0 },
      });
    }

    const sums = user.ratings.reduce(
      (acc, r) => {
        acc.reliability += r.reliability;
        acc.communication += r.communication;
        acc.quality += r.quality;
        return acc;
      },
      { reliability: 0, communication: 0, quality: 0 }
    );

    const avgRatings = {
      reliability: user.ratings.length
        ? (user.ratings.reduce((s, r) => s + (r.reliability || 0), 0) / user.ratings.length).toFixed(1)
        : null,
      communication: user.ratings.length
        ? (user.ratings.reduce((s, r) => s + (r.communication || 0), 0) / user.ratings.length).toFixed(1)
        : null,
      quality: user.ratings.length
        ? (user.ratings.reduce((s, r) => s + (r.quality || 0), 0) / user.ratings.length).toFixed(1)
        : null,
    };

    // ➕ Celkový průměr přes všechny kategorie
    const overall = user.ratings.length
      ? (
          user.ratings.reduce(
            (s, r) =>
              s + ((r.reliability || 0) + (r.communication || 0) + (r.quality || 0)) / 3,
            0
          ) / user.ratings.length
        ).toFixed(1)
      : null;

    res.json({
      success: true,
      ratings: user.ratings,
      averageRatings: { ...avgRatings, overall },
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};
// ------------------ GET PUBLIC PROFILE -----------------------
// 🔎 Public profil (rozšířeno o favorites info)
export const getPublicUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    // viewer Id buď z auth middleware (pokud je endpoint chráněný) nebo z query
    const viewerId = req.userId || req.query.viewerId || null;

    const user = await userModel
      .findById(userId)
      .select("name email avatar ico phone location description avatarPath backgroundPath ratings favoritedBy verification role isVerified specializace")
      .populate("ratings.from", "name avatarPath email");
    if (!user) {
      return res.status(404).json({ success: false, message: "Uživatel nenalezen" });
    }

    // phone normalize
    const phoneArray = Array.isArray(user.phone)
      ? user.phone
      : (typeof user.phone === "string" && user.phone.trim() ? [user.phone.trim()] : []);

    // gallery
    const gallery = await imageModel
      .find({ user: userId, inzerat: null, category: { $ne: null } })
      .select("path nazev category approved");

    // rating average
    const count = user.ratings.length;
    const ratings = user.ratings || [];

    const averageRatings = count
      ? {
          reliability: (ratings.reduce((s, r) => s + (r.reliability || 0), 0) / count).toFixed(1),
          communication: (ratings.reduce((s, r) => s + (r.communication || 0), 0) / count).toFixed(1),
          quality: (ratings.reduce((s, r) => s + (r.quality || 0), 0) / count).toFixed(1),
          overall: (
            ratings.reduce(
              (s, r) =>
                s + ((r.reliability || 0) + (r.communication || 0) + (r.quality || 0)) / 3,
              0
            ) / count
          ).toFixed(1),
        }
      : { reliability: 0, communication: 0, quality: 0, overall: 0 };

    const favoritesCount = user.favoritedBy?.length || 0;
    const isFavorited = viewerId
      ? user.favoritedBy?.some(u => String(u) === String(viewerId))
      : false;

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        phone: phoneArray,
        gallery: gallery.map(g => ({
          _id: g._id,
          path: g.path.replace(/\\/g, "/"),
          nazev: g.nazev,
          category: g.category,
          approved: g.approved
        })),
        ratings,
        averageRatings,
        favoritesCount,
        isFavorited
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ⬇️ přidat/odebrat oblíbeného uživatele
// addFavoriteUser
export const addFavoriteUser = async (req, res) => {
  try {
    const viewerId = req.userId;
    const { targetUserId } = req.body;
    if (!viewerId) return res.json({ success: false, message: "Nejste přihlášen" });
    if (!targetUserId) return res.json({ success: false, message: "Chybí targetUserId" });
    if (String(viewerId) === String(targetUserId)) {
      return res.json({ success: false, message: "Nemůžete si přidat sám sebe." });
    }

    // $addToSet vytvoří pole, pokud neexistuje, ale pro jistotu vybereme i _id
    const updated = await userModel.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { favoritedBy: viewerId } },
      { new: true }
    ).select("_id favoritedBy");

    if (!updated) return res.json({ success: false, message: "Uživatel nenalezen" });

    const favoritesCount = Array.isArray(updated.favoritedBy) ? updated.favoritedBy.length : 0;
    
    res.json({
      success: true,
      message: "Uživatel přidán do oblíbených",
      favoritesCount,
      isFavorited: true,
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// removeFavoriteUser
export const removeFavoriteUser = async (req, res) => {
  try {
    const viewerId = req.userId;
    const { targetUserId } = req.body;

    if (!viewerId) return res.json({ success: false, message: "Nejste přihlášen" });
    if (!targetUserId) return res.json({ success: false, message: "Chybí targetUserId" });

    const updated = await userModel.findByIdAndUpdate(
      targetUserId,
      { $pull: { favoritedBy: viewerId } },
      { new: true }
    ).select("_id favoritedBy");

    if (!updated) return res.json({ success: false, message: "Uživatel nenalezen" });

    const favoritesCount = Array.isArray(updated.favoritedBy) ? updated.favoritedBy.length : 0;

    res.json({
      success: true,
      message: "Uživatel odebrán z oblíbených",
      favoritesCount,
      isFavorited: false,
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

export const getTopUsers = async (req, res) => {
  try {
    const topUsers = await userModel.aggregate([
      {
        $project: {
          name: 1,
          email: 1,
          avatarPath: 1,
          location: 1,
          description: 1,
          favoritesCount: { $size: { $ifNull: ["$favoritedBy", []] } } // kolik lidí má v oblíbených
        }
      },
      { $sort: { favoritesCount: -1 } }, // seřadíme podle počtu
      { $limit: 10 } // top 10
    ]);

    res.json({ success: true, users: topUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const requestVerification = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Soubor chybí" });
    }

    const userId = req.userId; // z middleware userAuth
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Uživatel nenalezen" });
    }

    user.verification = {
      documentPath: req.file.path.replace(/\\/g, "/"),
      status: "pending",
      uploadedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: "Soubor pro ověření uložen",
      verification: user.verification
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 ADMIN – list všech pending verifikací
export const getPendingVerifications = async (req, res) => {
  try {
    const users = await userModel.find({ "verification.status": "pending" })
      .select("name email ico avatarPath verification");

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 ADMIN – schválit uživatele
export const approveVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findByIdAndUpdate(
      userId,
      { "verification.status": "approved",
        isVerified: true // 🔥 nastavíme true při schválení
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Uživatel nenalezen" });

    res.json({ success: true, message: "✅ Verifikace schválena", user });
  } catch (err) {
    console.log(err)
    res.status(500).json({ success: false, message: err.message });
  }
};

// 📌 ADMIN – zamítnout uživatele
export const rejectVerification = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(req.params)
    console.log(userId)
    const user = await userModel.findByIdAndUpdate(
      userId,
      { "verification.status": "rejected",
        isVerified: false // 🔥 při rejectu false
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "Uživatel nenalezen" });

    res.json({ success: true, message: "❌ Verifikace zamítnuta", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};