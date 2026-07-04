import express from "express";
import userModel from "../models/userModel.js";
import inzeratModel from "../models/inzeratModel.js";

const statsRouter = express.Router();

// 📊 Celkový přehled
statsRouter.get("/overview", async (req, res) => {
  try {
    // načteme uživatele a inzeráty
    const [users, inzeraty] = await Promise.all([
      userModel.countDocuments(),
      inzeratModel.find({}, "views favorites interestedUsers")
    ]);

    // spočítáme souhrny
    const totalViews = inzeraty.reduce((sum, i) => sum + (i.views || 0), 0);
    const totalLikes = inzeraty.reduce((sum, i) => sum + (i.favorites?.length || 0), 0);
    const totalInterests = inzeraty.reduce(
      (sum, i) => sum + (i.interestedUsers?.length || 0),
      0
    );

    res.json({
      success: true,
      stats: {
        users,
        inzeraty: inzeraty.length,
        totalViews,
        totalLikes,
        totalInterests
      }
    });
  } catch (err) {
    console.error("❌ Chyba při načítání overview statistik:", err);
    res.status(500).json({
      success: false,
      message: "Chyba při načítání statistik.",
      error: err.message
    });
  }
});
// 📊 Počet vytvořených inzerátů za posledních 12 měsíců
statsRouter.get("/monthly-inzeraty", async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    // najdeme všechny inzeráty z posledních 12 měsíců
    const inzeraty = await inzeratModel.find({ createdAt: { $gte: startDate } }, "createdAt");

    // inicializujeme měsíční počitadla
    const monthlyCounts = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        month: date.toLocaleString("cs-CZ", { month: "short" }),
        year: date.getFullYear(),
        count: 0,
      };
    });

    // spočítáme, kolik inzerátů spadá do kterého měsíce
    inzeraty.forEach((item) => {
      const d = new Date(item.createdAt);
      const diffMonths =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths >= 0 && diffMonths < 12) {
        monthlyCounts[11 - diffMonths].count++;
      }
    });

    res.json({ success: true, data: monthlyCounts });
  } catch (err) {
    console.error("❌ Chyba při načítání měsíčních statistik:", err);
    res.status(500).json({
      success: false,
      message: "Chyba při načítání měsíčních statistik.",
    });
  }
});
// 📊 Počet nových uživatelů za posledních 12 měsíců
statsRouter.get("/monthly-users", async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const users = await userModel.find({ createdAt: { $gte: startDate } }, "createdAt");

    const monthlyCounts = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        month: date.toLocaleString("cs-CZ", { month: "short" }),
        year: date.getFullYear(),
        count: 0,
      };
    });

    users.forEach((u) => {
      const d = new Date(u.createdAt);
      const diffMonths =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths >= 0 && diffMonths < 12) {
        monthlyCounts[11 - diffMonths].count++;
      }
    });

    res.json({ success: true, data: monthlyCounts });
  } catch (err) {
    console.error("❌ Chyba při načítání měsíčních statistik uživatelů:", err);
    res.status(500).json({
      success: false,
      message: "Chyba při načítání statistik uživatelů.",
    });
  }
});
// 1️⃣ Rozložení inzerátů podle kategorií
statsRouter.get("/categories", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      { $group: { _id: "$kategorie", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatted = data.map(d => ({
      category: d._id || "Nezařazeno",
      count: d.count
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Chyba při načítání kategorií:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání kategorií" });
  }
});

// 5️⃣ Poměr aktivních vs. neaktivních uživatelů
statsRouter.get("/active-users", async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const activeUserIds = await inzeratModel.distinct("user");
    const active = activeUserIds.length;
    const inactive = Math.max(totalUsers - active, 0);

    res.json({
      success: true,
      data: [
        { name: "Aktivní", value: active },
        { name: "Neaktivní", value: inactive }
      ]
    });
  } catch (err) {
    console.error("❌ Chyba při načítání aktivních uživatelů:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání aktivních uživatelů" });
  }
});

// 6️⃣ Rozložení inzerátů podle krajů
statsRouter.get("/by-kraj", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      { $group: { _id: "$kraj", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatted = data.map(d => ({
      kraj: d._id || "Neuvedeno",
      count: d.count
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Chyba při načítání inzerátů podle krajů:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání inzerátů podle krajů" });
  }
});
statsRouter.get("/engagement", async (req, res) => {
  try {
    const inzeraty = await inzeratModel.find({}, "nadpis views favorites interestedUsers").lean();

    const scored = inzeraty.map((i) => ({
      title: i.nadpis || "Bez názvu",
      views: i.views || 0,
      favorites: i.favorites?.length || 0,
      interests: i.interestedUsers?.length || 0,
      score:
        (i.views || 0) * 0.1 +
        (i.favorites?.length || 0) * 2 +
        (i.interestedUsers?.length || 0) * 3
    }));

    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // top 10

    res.json({ success: true, data: top });
  } catch (err) {
    console.error("❌ Chyba při výpočtu engagementu:", err);
    res.status(500).json({
      success: false,
      message: "Chyba při výpočtu engagement skóre.",
    });
  }
});
// 1️⃣ Aktivita uživatelů (inzeráty, zájmy, zprávy)
statsRouter.get("/user-activity", async (req, res) => {
  try {
    const inzeratyCount = await inzeratModel.aggregate([
      { $group: { _id: "$user", count: { $sum: 1 } } }
    ]);

    const interestCount = await inzeratModel.aggregate([
      { $unwind: "$interestedUsers" },
      { $group: { _id: "$interestedUsers.user", count: { $sum: 1 } } }
    ]);

    const allIds = new Set([
      ...inzeratyCount.map(i => String(i._id)),
      ...interestCount.map(i => String(i._id)),
    ]);

    const merged = [...allIds].map(id => {
      const inz = inzeratyCount.find(i => String(i._id) === id)?.count || 0;
      const int = interestCount.find(i => String(i._id) === id)?.count || 0;
      return { userId: id, inzeraty: inz, zajmy: int, total: inz + int };
    });

    const users = await userModel.find({ _id: { $in: [...allIds] } }, "name email").lean();

    const withNames = merged.map(m => {
      const u = users.find(x => String(x._id) === m.userId);
      return { name: u?.name || u?.email || "Neznámý", ...m };
    });

    res.json({ success: true, data: withNames.sort((a,b)=>b.total-a.total).slice(0,10) });
  } catch (err) {
    console.error("❌ Chyba při načítání aktivity uživatelů:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání aktivity uživatelů" });
  }
});


// 2️⃣ Týdenní aktivita (registrace, inzeráty, zájmy)
statsRouter.get("/weekly-activity", async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const users = await userModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]);

    const inzeraty = await inzeratModel.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } }
    ]);

    const merged = {};
    [...users, ...inzeraty].forEach(e => {
      if (!merged[e._id]) merged[e._id] = { date: e._id, users: 0, inzeraty: 0 };
      if (users.find(u => u._id === e._id)) merged[e._id].users = e.count;
      if (inzeraty.find(i => i._id === e._id)) merged[e._id].inzeraty = e.count;
    });

    const sorted = Object.values(merged).sort((a,b)=>new Date(a.date)-new Date(b.date));

    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error("❌ Chyba při weekly activity:", err);
    res.status(500).json({ success: false });
  }
});


// 3️⃣ Poměr kategorií podle krajů
statsRouter.get("/category-by-kraj", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      { $group: { _id: { kraj: "$kraj", kategorie: "$kategorie" }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Chyba při načítání kategorií podle krajů:", err);
    res.status(500).json({ success: false });
  }
});


// 4️⃣ Průměrná cena podle jednotky
statsRouter.get("/avg-price", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      { $group: { _id: "$cenaType", avgPrice: { $avg: "$cenaPerHa" } } },
      { $sort: { avgPrice: -1 } }
    ]);
    res.json({ success: true, data });
  } catch (err) {
    console.error("❌ Chyba při načítání průměrných cen:", err);
    res.status(500).json({ success: false });
  }
});



// 6️⃣ Nejlépe hodnocení uživatelé podle reliability/communication/quality
statsRouter.get("/top-rated-users", async (req, res) => {
  try {
    const users = await userModel.find(
      { ratings: { $exists: true, $ne: [] } },
      "name email ratings"
    ).lean();

    const rated = users.map(u => {
      const r = u.ratings || [];

      const avgReliability = r.length ? r.reduce((a, b) => a + (b.reliability || 0), 0) / r.length : 0;
      const avgCommunication = r.length ? r.reduce((a, b) => a + (b.communication || 0), 0) / r.length : 0;
      const avgQuality = r.length ? r.reduce((a, b) => a + (b.quality || 0), 0) / r.length : 0;

      const overall = (avgReliability + avgCommunication + avgQuality) / 3;

      return {
        name: u.name || u.email || "Neznámý",
        email: u.email,
        avgReliability: Number(avgReliability.toFixed(2)),
        avgCommunication: Number(avgCommunication.toFixed(2)),
        avgQuality: Number(avgQuality.toFixed(2)),
        overall: Number(overall.toFixed(2)),
        totalRatings: r.length
      };
    });

    const sorted = rated.sort((a, b) => b.overall - a.overall).slice(0, 10);

    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error("❌ Chyba při výpočtu hodnocených uživatelů:", err);
    res.status(500).json({ success: false });
  }
});
// 1️⃣ Měsíční engagement (views, favorites, interests)
statsRouter.get("/engagement-monthly", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // např. "2025-10"
          views: { $sum: "$views" },
          likes: { $sum: { $size: "$favorites" } },
          interests: { $sum: { $size: "$interestedUsers" } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = data.map((d) => ({
      month: d._id,
      views: d.views || 0,
      likes: d.likes || 0,
      interests: d.interests || 0,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Chyba při načítání měsíčního engagementu:", err);
    res.status(500).json({ success: false });
  }
});

// 2️⃣ Počet inzerátů podle kraje
statsRouter.get("/geo-kraje", async (req, res) => {
  try {
    const data = await inzeratModel.aggregate([
      { $group: { _id: "$kraj", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const formatted = data.map((d) => ({
      kraj: d._id || "Neuvedeno",
      count: d.count,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("❌ Chyba při načítání mapy krajů:", err);
    res.status(500).json({ success: false });
  }
});

export default statsRouter;
