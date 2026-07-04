import savedSearchModel from "../models/savedSearchModel.js";

const MAX_SAVED = 10;

export const createSavedSearch = async (req, res) => {
  try {
    const userId = req.userId;
    const count = await savedSearchModel.countDocuments({ user: userId });
    if (count >= MAX_SAVED) {
      return res.status(400).json({
        success: false,
        message: `Maximální počet uložených hledání je ${MAX_SAVED}`,
      });
    }

    const { name, kategorie, ukon, kraj, search, minCena, maxCena } = req.body;

    const saved = await savedSearchModel.create({
      user: userId,
      name: (name || "").slice(0, 100) || buildAutoName({ kategorie, kraj, ukon }),
      kategorie: kategorie || "",
      ukon: ukon || "",
      kraj: kraj || "",
      search: search || "",
      minCena: minCena ?? null,
      maxCena: maxCena ?? null,
    });

    return res.json({ success: true, message: "Hledání uloženo", savedSearch: saved });
  } catch (err) {
    console.error("❌ createSavedSearch:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMySavedSearches = async (req, res) => {
  try {
    const list = await savedSearchModel
      .find({ user: req.userId })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, savedSearches: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteSavedSearch = async (req, res) => {
  try {
    const result = await savedSearchModel.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!result) return res.status(404).json({ success: false, message: "Nenalezeno" });
    return res.json({ success: true, message: "Hledání odstraněno" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleAlert = async (req, res) => {
  try {
    const saved = await savedSearchModel.findOne({ _id: req.params.id, user: req.userId });
    if (!saved) return res.status(404).json({ success: false, message: "Nenalezeno" });
    saved.alertEnabled = !saved.alertEnabled;
    await saved.save();
    return res.json({ success: true, alertEnabled: saved.alertEnabled });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Auto-název z filtrů
function buildAutoName({ kategorie, kraj, ukon }) {
  const parts = [kategorie, ukon, kraj].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Všechny zakázky";
}
