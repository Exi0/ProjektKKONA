import reportModel from "../models/reportModel.js";
import userModel from "../models/userModel.js";

// 📌 Uživatel nahlásí jiného uživatele
export const createReport = async (req, res, next) => {
  try {
    const fromUserId = req.userId; // ✅ z userAuth middleware
    const { reportedUserId, reason } = req.body;

    if (!reportedUserId || !reason) {
      return res.json({ success: false, message: "Chybí údaje k nahlášení." });
    }

    const report = await reportModel.create({
      fromUser: fromUserId,
      reportedUser: reportedUserId,
      reason,
    });

    res.json({ success: true, message: "Nahlášení bylo odesláno.", report });
  } catch (err) {
    return next(err);
  }
};

// 📌 Admin – seznam všech reportů
export const getReports = async (req, res, next) => {
  try {
    const reports = await reportModel
      .find()
      .populate("fromUser", "name email avatarPath")
      .populate("reportedUser", "name email avatarPath");

    res.json({ success: true, reports });
  } catch (err) {
    return next(err);
  }
};

// 📌 Admin – smazat report
export const deleteReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    await reportModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Report byl odstraněn." });
  } catch (err) {
    return next(err);
  }
};
