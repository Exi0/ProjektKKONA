// controllers/inzeratController.js
import inzeratModel from "../models/inzeratModel.js";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import { createNotification } from "../services/notificationService.js";
import { NEW_INTEREST_TEMPLATE, REMOVE_INTEREST_TEMPLATE } from "../config/emailTemplates.js";
import { fillTemplate } from "../utils/fillTemplate.js";
import sanitizeHtml from "sanitize-html";

// Common sanitizer for RTF HTML
const sanitizePopis = (html) =>
  sanitizeHtml(html || '', {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1','h2','h3','img','span']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt'],
      a: ['href', 'name', 'target', 'rel'],
      '*': ['style']
    },
    allowedSchemes: ['http','https','data','mailto'],
    // keep styles modestly (optional)
    allowedStyles: {
      '*': {
        // basic inline styles
        'color': [/^.*$/],
        'background-color': [/^.*$/],
        'text-align': [/^.*$/],
        'font-size': [/^.*$/],
        'font-weight': [/^.*$/]
      }
    }
  });

// ✅ Vytvořit inzerát
export const createItem = async (req, res) => {
  try {
    const {
      userId,
      nadpis,
      popis,
      ukon,
      kraj,
      kategorie,
      ha,
      cenaPerHa,
      cenaType,
      stat,
      mesto,
      stav,
      location
    } = req.body;

    const user = await userModel.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "Uživatel nenalezen" });

    // 🧠 Rozhodnutí podle stavu
    const isDraft = stav === "Rozpracovaný";
    // ✅ Povinná pole podle režimu
    const required = isDraft
      ? { nadpis, popis, ukon, kategorie }
      : { nadpis, popis, ukon, kraj, kategorie, cenaPerHa, stat, mesto};

    for (const [k, v] of Object.entries(required)) {
      if (v === undefined || v === null || v === "") {
        return res.status(400).json({
          success: false,
          message: `Chybí povinné pole: ${k}`
        });
      }
    }

    // čísla
    const cena = parseFloat(cenaPerHa);
    const plocha = parseFloat(ha);

    // bezpečný HTML popis
    const safePopis = sanitizePopis(popis);
    let geoLocation = undefined;

    if (
      location &&
      location.coordinates &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      const [lng, lat] = location.coordinates;

      if (
        typeof lng === "number" &&
        typeof lat === "number"
      ) {
        geoLocation = {
          type: "Point",
          coordinates: [lng, lat]
        };
      }
    }
    const inzerat = new inzeratModel({
      nadpis: String(nadpis).trim(),
      popis: safePopis,
      ukon: ukon || "",
      kraj: kraj || "",
      kategorie: kategorie || "",
      ha: Number.isNaN(plocha) ? 0 : plocha,
      cenaPerHa: Number.isNaN(cena) ? 0 : cena,
      cenaType: ["ha", "h", "t", "kg"].includes(cenaType) ? cenaType : "ha",
      stat: stat || "",
      mesto: mesto || "",
      user: user._id,
      stav: stav || "Rozpracovaný",
      location: geoLocation,
    });

    await inzerat.save();

    const msg =
      stav === "Rozpracovaný"
        ? "Inzerát uložen jako rozpracovaný."
        : "Inzerát vytvořen a odeslán ke schválení.";

    res.json({ success: true, message: msg, id: inzerat.id });
  } catch (error) {
    console.error("❌ Chyba při vytváření inzerátu:", error);
    res
      .status(500)
      .json({ success: false, message: "Serverová chyba: " + error.message });
  }
};


// ===================================================================
// NÁVOD: V controllers/inzeratController.js nahraď CELOU původní funkci
// getInzeratData (cca řádky 133–156) kódem níže. Helper escapeRegex
// vlož nad ni (např. pod sanitizePopis). Nic jiného se v souboru nemění.
//
// Endpoint zůstává: GET /api/inzerat/getInzeraty
// Nové query parametry (všechny volitelné):
//   page, limit, search, kraj, kategorie, ukon,
//   minCena, maxCena, minRating, sort
// Hodnoty sort: nejnovejsi | nejstarsi | cenaAsc | cenaDesc | views | zajem | hodnoceni
//
// Bez parametrů vrátí 1. stránku (10 ks) → AppContext.jsx funguje beze změny.
// ===================================================================

// 🔒 Escapování uživatelského vstupu pro regex (jinak by "a+b" rozbilo dotaz)
const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ Veřejné inzeráty – stránkování + filtrování + řazení NA SERVERU
export const getInzeratData = async (req, res) => {
  try {
    // ---- vstupy z query ----
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const { search, kraj, kategorie, ukon, sort } = req.query;
    const minCena = req.query.minCena !== undefined ? Number(req.query.minCena) : null;
    const maxCena = req.query.maxCena !== undefined ? Number(req.query.maxCena) : null;
    const minRating = req.query.minRating !== undefined ? Number(req.query.minRating) : 0;

    // ---- základní filtr ----
    const match = { stav: "Veřejný" };
    if (kraj) match.kraj = kraj;
    if (kategorie) match.kategorie = kategorie;
    if (ukon) match.ukon = ukon;
    if (minCena !== null || maxCena !== null) {
      match.cenaPerHa = {};
      if (minCena !== null && !Number.isNaN(minCena)) match.cenaPerHa.$gte = minCena;
      if (maxCena !== null && !Number.isNaN(maxCena)) match.cenaPerHa.$lte = maxCena;
    }
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      match.$or = [{ nadpis: rx }, { popis: rx }, { ukon: rx }];
    }

    // ---- řazení (whitelist – nikdy nepouštět raw vstup do $sort) ----
    const sortMap = {
      nejnovejsi: { createdAt: -1 },
      nejstarsi: { createdAt: 1 },
      cenaAsc: { cenaPerHa: 1 },
      cenaDesc: { cenaPerHa: -1 },
      views: { views: -1 },
      zajem: { zajemCount: -1 },
      hodnoceni: { userOverallRating: -1 },
    };
    // sekundárně podle _id → stabilní stránkování (žádné přeskakující položky)
    const sortStage = { ...(sortMap[sort] || sortMap.nejnovejsi), _id: -1 };

    // ---- agregace: filtr → join autora → vypočítané sloupce → sort → stránka ----
    const pipeline = [
      { $match: match },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          // počet zájemců (pro sort "zajem")
          zajemCount: { $size: { $ifNull: ["$interestedUsers", []] } },
          // průměrné hodnocení autora (pro sort "hodnoceni" a filtr minRating)
          userOverallRating: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$user.ratings", []] } }, 0] },
              {
                $avg: {
                  $map: {
                    input: "$user.ratings",
                    as: "r",
                    in: {
                      $divide: [
                        {
                          $add: [
                            { $ifNull: ["$$r.reliability", 0] },
                            { $ifNull: ["$$r.communication", 0] },
                            { $ifNull: ["$$r.quality", 0] },
                          ],
                        },
                        3,
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      ...(minRating > 0 && !Number.isNaN(minRating)
        ? [{ $match: { userOverallRating: { $gte: minRating } } }]
        : []),
      { $sort: sortStage },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              // 🔒 ven posíláme jen bezpečná pole (žádné heslo, OTP apod.)
              $project: {
                nadpis: 1, popis: 1, kategorie: 1, ukon: 1, kraj: 1, stat: 1,
                mesto: 1, cenaPerHa: 1, ha: 1, cenaType: 1, stav: 1,
                createdAt: 1, views: 1, favorites: 1, deadline: 1, location: 1,
                zajemCount: 1, userOverallRating: 1,
                "user._id": 1, "user.name": 1, "user.email": 1, "user.avatarPath": 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await inzeratModel.aggregate(pipeline);
    const items = result?.items || [];
    const total = result?.totalCount?.[0]?.count || 0;

    // globální min/max ceny veřejných inzerátů → meze slideru na frontendu
    const [limits] = await inzeratModel.aggregate([
      { $match: { stav: "Veřejný" } },
      { $group: { _id: null, min: { $min: "$cenaPerHa" }, max: { $max: "$cenaPerHa" } } },
    ]);

    return res.json({
      success: true,
      message: "Veřejné inzeráty načteny",
      inzeratData: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      priceLimits: { min: limits?.min ?? 0, max: limits?.max ?? 0 },
    });
  } catch (error) {
    console.error("❌ Chyba při načítání inzerátů:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Inzeráty uživatele
export const getUserInzerats = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || req.query.userId;
    const inzerats = await inzeratModel.find({ user: userId });
    if (!inzerats.length) return res.json({ success: false, message: "Žádné inzeráty" });
    res.json({ success: true, inzeratData: inzerats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Detail inzerátu
export const getInzeratItemData = async (req, res) => {
  try {
    const { inzeratId } = req.query;
    const inzerat = await inzeratModel
      .findById(inzeratId)
      .populate("interestedUsers.user", "name email avatarPath") // jen bezpečná pole
      .populate("user", "name email avatarPath backgroundPath ico location description"); // jen potřebná pole

    if (!inzerat) return res.json({ success: false, message: "Inzerát nenalezen" });
    res.json({ success: true, inzeratData: { ...inzerat._doc } });
  } catch (error) {
    console.error("❌ Chyba v getInzeratItemData:", error);
    res.json({ success: false, message: error.message });
  }
};

// ✅ Smazat
export const deleteInzerat = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    if (!inzeratId) {
      return res.status(400).json({ success: false, message: "Chybí inzeratId" });
    }

    const inzerat = await inzeratModel.findById(inzeratId);
    if (!inzerat) {
      return res.status(404).json({ success: false, message: "Inzerát nenalezen" });
    }

    // 🔒 Ownership check – smazat smí jen vlastník
    if (inzerat.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění smazat tento inzerát" });
    }

    await inzerat.deleteOne();
    return res.json({ success: true, message: "Inzerát smazán" });
  } catch (error) {
    console.error("❌ Chyba v deleteInzerat:", error);
    return res.status(500).json({ success: false, message: "Chyba serveru" });
  }
};

// ✅ Upravit
export const editInzerat = async (req, res) => {
  try {
    const {
      inzeratId,
      nadpis,
      popis,
      ukon,
      cenaPerHa,
      cenaType,
      stat,
      mesto,
      kraj,
      ha,
      kategorie,
      location
    } = req.body;

    // 🔒 Ownership check – upravit smí jen vlastník inzerátu
    if (!inzeratId) {
      return res.status(400).json({ success: false, message: "Chybí inzeratId" });
    }
    const inzerat = await inzeratModel.findById(inzeratId).select("user");
    if (!inzerat) {
      return res.status(404).json({ success: false, message: "Inzerát nenalezen" });
    }
    if (inzerat.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění upravit tento inzerát" });
    }
    const cena = parseFloat(cenaPerHa);
    const plocha = parseFloat(ha);
    let geoLocation = undefined;

    if (
      location &&
      Array.isArray(location.coordinates) &&
      location.coordinates.length === 2
    ) {
      geoLocation = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    const updateData = {
      nadpis: nadpis?.trim(),
      popis: sanitizePopis(popis),
      ukon,
      cenaPerHa: Number.isNaN(cena) ? 0 : cena,
      cenaType: ['ha','h','t','kg'].includes(cenaType) ? cenaType : 'ha',
      stat: stat || '',
      mesto: mesto || '',
      kraj: kraj || '',
      ha: Number.isNaN(plocha) ? 0 : plocha,
      kategorie,
      zmeneno: Date.now(),
      location: geoLocation,
    };

    const updated = await inzeratModel.findByIdAndUpdate(
      inzeratId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Inzerát nenalezen" });
    }

    res.json({ success: true, message: "Inzerát upraven", result: updated });
  } catch (error) {
    console.error("❌ Chyba v editInzerat:", error);
    res.status(500).json({ success: false, message: "Serverová chyba: " + error.message });
  }
};

// ✅ Oblíbené
export const addToFavoriteInzerat = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const updated = await inzeratModel.findByIdAndUpdate(
      inzeratId,
      { $addToSet: { favorites: req.userId } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.json({ success: false, message: "Inzerát nenalezen" });
    res.json({ success: true, message: "Přidán do oblíbených", result: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const removeFromFavoriteInzerat = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const updated = await inzeratModel.findByIdAndUpdate(
      inzeratId,
      { $pull: { favorites: req.userId } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.json({ success: false, message: "Inzerát nenalezen" });
    res.json({ success: true, message: "Odebrán z oblíbených", result: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserFavoriteInzerats = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId || req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Chybí userId" });
    }

    const inzerats = await inzeratModel
      .find({ favorites: userId })
      .populate('user', 'name email')
      .select('-comments -rating')
      .lean();

    return res.json({ success: true, inzeratData: inzerats, count: inzerats.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Zájemci (ponecháno)
// 📨 Přidání zájemce se zprávou + e-mail notifikace
export const addInterestedUser = async (req, res) => {
  try {
    const { userId, inzeratId, text } = req.body;

    if (!text || !text.trim()) {
      return res.json({ success: false, message: "Zpráva k zájmu je povinná." });
    }

    const inzerat = await inzeratModel.findById(inzeratId).populate("user");
    if (!inzerat) {
      return res.json({ success: false, message: "Inzerát nenalezen" });
    }

    // zkontroluj, jestli už zájem existuje
    const exists = inzerat.interestedUsers.find(
      (iu) => iu.user.toString() === userId
    );
    if (exists) {
      return res.json({ success: false, message: "Už jste projevili zájem." });
    }

    inzerat.interestedUsers.push({
      user: userId,
      text,
      createdAt: new Date(),
    });
    const updated = await inzerat.save();

    // načti info o uživateli, který projevil zájem
    const user = await userModel.findById(userId);

    // e-mail autorovi inzerátu
    if (inzerat.user?.email) {
      const htmlContent = fillTemplate(NEW_INTEREST_TEMPLATE, {
        authorName: inzerat.user.name,
        userName: user?.name || "Neznámý uživatel",
        userEmail: user?.email || "",
        adTitle: inzerat.nadpis,
        userMessage: text,
        adLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/inzerat/${inzeratId}`,
      });

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: inzerat.user.email,
        subject: "📢 Nový zájemce o váš inzerát",
        html: htmlContent,
      });
    }

    res.json({ success: true, message: "Zájem byl přidán", result: updated });
    // 📢 In-app notifikace autorovi inzerátu
    // (e-mail se už posílá výše přes transporter, proto sendEmail: false)
    await createNotification({
      recipientId: inzerat.user._id.toString(),
      type: "new_interest",
      title: "Nový zájemce o vaši zakázku",
      message: `${user?.name || "Uživatel"} projevil zájem o „${inzerat.nadpis}".`,
      link: `/inzerat/${inzeratId}`,
      sendEmail: false, // e-mail už posílá existující kód výše
    });
  } catch (error) {
    console.error("❌ addInterestedUser error:", error);
    res.json({ success: false, message: error.message });
  }
};

// ❌ Odebrání zájemce + e-mail notifikace
export const removeInterestedUser = async (req, res) => {
  try {
    const { userId, inzeratId } = req.body;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user");
    if (!inzerat) {
      return res.json({ success: false, message: "Inzerát nenalezen" });
    }

    // aktualizuj seznam zájemců
    inzerat.interestedUsers = inzerat.interestedUsers.filter(
      (iu) => iu.user.toString() !== userId
    );
    const updated = await inzerat.save();

    // načti info o uživateli, který odebral zájem
    const user = await userModel.findById(userId);

    // e-mail autorovi inzerátu
    if (inzerat.user?.email) {
      const htmlContent = fillTemplate(REMOVE_INTEREST_TEMPLATE, {
        authorName: inzerat.user.name,
        userName: user?.name || "Neznámý uživatel",
        userEmail: user?.email || "",
        adTitle: inzerat.nadpis,
        adLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/inzerat/${inzeratId}`,
      });

      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: inzerat.user.email,
        subject: "ℹ️ Uživatel odebral zájem o váš inzerát",
        html: htmlContent,
      });
    }

    res.json({ success: true, message: "Zájemce odebrán", result: updated });
    // 📢 In-app notifikace autorovi
    await createNotification({
      recipientId: inzerat.user._id.toString(),
      type: "interest_removed",
      title: "Zájemce se odhlásil",
      message: `${user?.name || "Uživatel"} odebral zájem o „${inzerat.nadpis}".`,
      link: `/inzerat/${inzeratId}`,
      sendEmail: false, // e-mail už posílá existující kód výše
    });
  } catch (error) {
    console.error("❌ removeInterestedUser error:", error);
    res.json({ success: false, message: error.message });
  }
};
// ✅ Navýšit zobrazení
export const incrementViews = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const updated = await inzeratModel.findByIdAndUpdate(inzeratId, { $inc: { views: 1 } }, { new: true });
    if (!updated) return res.json({ success: false, message: "Inzerát nenalezen" });
    res.json({ success: true, message: "Zobrazení navýšeno", views: updated.views });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Poblíž
export const getNearbyInzerats = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;
    const inzeraty = await inzeratModel.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
          $maxDistance: parseInt(maxDistance) || 5000
        }
      }
    });

    res.json({ success: true, inzeratData: inzeraty });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const selectWinner = async (req, res) => {
  try {
    const { inzeratId, winnerId } = req.body;

    const inzerat = await inzeratModel.findById(inzeratId)
      .populate("user")
      .populate("interestedUsers.user");

    if (!inzerat) {
      return res.json({ success: false, message: "Inzerát nenalezen" });
    }

    // uložíme vítěze
    inzerat.winner = winnerId;
    // ✅ Posuň stav na "Domluveno" a inicializuj deal
    inzerat.stav = "Domluveno";
    inzerat.statusHistory.push({
      stav: "Domluveno",
      date: new Date(),
      note: "Vítěz vybrán",
    });
    // Předvyplň dohodnutou cenu z inzerátu (owner/winner ji můžou upravit)
    if (!inzerat.deal) inzerat.deal = {};
    inzerat.deal.agreedPrice = inzerat.cenaPerHa;
    await inzerat.save();

    // 📧 Notifikace autorovi i vítězi
    const winner = inzerat.interestedUsers.find(u => u.user._id.toString() === winnerId);
    const author = inzerat.user;

    if (winner?.user?.email) {
      await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to: winner.user.email,
        subject: "🎉 Byli jste vybrán jako vítěz zakázky",
        html: `
          <p>Dobrý den ${winner.user.name},</p>
          <p>Byli jste vybrán jako vítěz zakázky: <strong>${inzerat.nadpis}</strong></p>
          <p>Kontaktujte prosím autora: ${author.name} (${author.email})</p>
          <p><a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/inzerat/${inzeratId}">Zobrazit zakázku</a></p>        `
      });
    }
    
    res.json({ success: true, message: "Vítěz vybrán", inzerat });

     // 📢 In-app notifikace vítězi
    // (e-mail se už posílá výše, proto sendEmail: false)
    if (winnerId) {
      await createNotification({
        recipientId: winnerId,
        type: "winner_selected",
        title: "Byli jste vybráni!",
        message: `Gratulujeme! Byli jste vybráni jako vítěz zakázky „${inzerat.nadpis}".`,
        link: `/inzerat/${inzeratId}`,
        sendEmail: false,
      });
    }
  } catch (err) {
    console.error("❌ selectWinner error:", err);
    res.json({ success: false, message: err.message });
  }
};
// 🏆 Získání všech inzerátů, kde je uživatel výherce
export const getWinnerInzerats = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Chybí userId v parametrech dotazu.",
      });
    }

    // Najdeme všechny inzeráty, kde je výherce (winnerId) = userId
    const inzeratData = await inzeratModel.find({ winner: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("winner", "name email")
      .lean();

    if (!inzeratData || inzeratData.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Nenalezeny žádné výherní zakázky.",
        inzeratData: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Výherní zakázky načteny úspěšně.",
      inzeratData,
    });
  } catch (error) {
    console.error("❌ Chyba při načítání výherních zakázek:", error);
    res.status(500).json({
      success: false,
      message: "Interní chyba serveru při načítání zakázek.",
    });
  }
};
export const getPendingInzeraty = async (req, res) => {
  try {
    const inzeraty = await inzeratModel
      .find({ stav: "Čeká na schválení" })
      .populate("user", "name email ico")
      .sort({ createdAt: -1 });

    if (!inzeraty.length) {
      return res.json({
        success: false,
        message: "Žádné inzeráty čekající na schválení.",
      });
    }

    res.json({
      success: true,
      message: "Inzeráty čekající na schválení načteny.",
      inzeratData: inzeraty,
    });
  } catch (error) {
    console.error("❌ Chyba při načítání inzerátů ke schválení:", error);
    res.status(500).json({
      success: false,
      message: "Serverová chyba: " + error.message,
    });
  }
};
export const publishInzerat = async (req, res) => {
  try {
    const { inzeratId } = req.body;

    if (!inzeratId)
      return res
        .status(400)
        .json({ success: false, message: "Chybí ID inzerátu." });

    const inzerat = await inzeratModel.findById(inzeratId);
    if (!inzerat)
      return res
        .status(404)
        .json({ success: false, message: "Inzerát nebyl nalezen." });

    if (inzerat.stav !== "Čeká na schválení") {
      return res.status(400).json({
        success: false,
        message: `Nelze publikovat inzerát, který není ve stavu 'Čeká na schválení' (aktuální stav: ${inzerat.stav}).`,
      });
    }

    // ✅ změna stavu
    inzerat.stav = "Veřejný";
    inzerat.statusHistory.push({ stav: "Veřejný", date: new Date() });

    await inzerat.save();
    // 📢 Notifikace autorovi, že jeho inzerát byl schválen a zveřejněn
    await createNotification({
      recipientId: inzerat.user.toString(),
      type: "inzerat_approved",
      title: "Váš inzerát byl schválen",
      message: `Inzerát „${inzerat.nadpis}" je nyní veřejný a viditelný pro všechny uživatele.`,
      link: `/inzerat/${inzerat._id}`,
      sendEmail: true,
      emailSubject: "✅ Váš inzerát byl schválen a zveřejněn",
    });
    res.json({
      success: true,
      message: "Inzerát byl úspěšně publikován.",
      inzeratId: inzerat._id,
    });
  } catch (error) {
    console.error("❌ Chyba při publikování inzerátu:", error);
    res.status(500).json({
      success: false,
      message: "Serverová chyba: " + error.message,
    });
  }
};
export const setInterestedUserLike = async (req, res) => {
  try {
    const { inzeratId, userId, like } = req.body;

    // 🔒 Like na zájemce smí nastavit jen vlastník inzerátu
    const inzerat = await inzeratModel.findById(inzeratId).select("user");
    if (!inzerat) {
      return res.status(404).json({ success: false, message: "Inzerát nenalezen" });
    }
    if (inzerat.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    const updated = await inzeratModel.findOneAndUpdate(
      { _id: inzeratId, "interestedUsers.user": userId },
      { $set: { "interestedUsers.$.like": like, "interestedUsers.$.readStatus": true } },
      { new: true }
    );
    if (!updated) {
      return res.json({ success: false, message: "Zájemce nenalezen v seznamu" });
    }
    res.json({ success: true, message: "Like úspěšně nastaven", interestedUsers: updated.interestedUsers });
  } catch (error) {
    console.error("❌ setInterestedUserLike:", error);
    res.status(500).json({ success: false, message: "Chyba serveru" });
  }
};
export const setInterestedUserRead = async (req, res) => {
  try {
    const { inzeratId, userId, read } = req.body;

    // 🔒 Read status smí nastavit jen vlastník inzerátu
    const inzerat = await inzeratModel.findById(inzeratId).select("user");
    if (!inzerat) {
      return res.status(404).json({ success: false, message: "Inzerát nenalezen" });
    }
    if (inzerat.user.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    const updated = await inzeratModel.findOneAndUpdate(
      { _id: inzeratId, "interestedUsers.user": userId },
      { $set: { "interestedUsers.$.readStatus": read } },
      { new: true }
    );
    if (!updated) {
      return res.json({ success: false, message: "Zájemce nenalezen v seznamu" });
    }
    res.json({ success: true, message: "Read status nastaven", interestedUsers: updated.interestedUsers });
  } catch (error) {
    console.error("❌ setInterestedUserRead:", error);
    res.status(500).json({ success: false, message: "Chyba serveru" });
  }
};
// ✅ Lehký endpoint pro mapové piny — vrátí jen souřadnice + základní info
// Žádné stránkování (potřebujeme všechny body na mapě najednou), žádný
// HTML popis (ušetří desítky kB u velkých seznamů).
// Podporuje volitelné filtry: kraj, kategorie, ukon, minCena, maxCena.
export const getMapInzerats = async (req, res) => {
  try {
    const { kraj, kategorie, ukon } = req.query;
    const minCena = req.query.minCena !== undefined ? Number(req.query.minCena) : null;
    const maxCena = req.query.maxCena !== undefined ? Number(req.query.maxCena) : null;
 
    const match = {
      stav: "Veřejný",
      // jen inzeráty, které mají souřadnice (jinak by na mapě neměly smysl)
      "location.coordinates": { $exists: true },
    };
    if (kraj) match.kraj = kraj;
    if (kategorie) match.kategorie = kategorie;
    if (ukon) match.ukon = ukon;
    if (minCena !== null || maxCena !== null) {
      match.cenaPerHa = {};
      if (minCena !== null && !Number.isNaN(minCena)) match.cenaPerHa.$gte = minCena;
      if (maxCena !== null && !Number.isNaN(maxCena)) match.cenaPerHa.$lte = maxCena;
    }
 
    const items = await inzeratModel.find(match, {
      // Projekce: jen to, co pin potřebuje
      nadpis: 1,
      kategorie: 1,
      ukon: 1,
      kraj: 1,
      mesto: 1,
      cenaPerHa: 1,
      cenaType: 1,
      ha: 1,
      location: 1,
      createdAt: 1,
      views: 1,
    }).lean();
 
    return res.json({ success: true, markers: items });
  } catch (error) {
    console.error("❌ getMapInzerats error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};