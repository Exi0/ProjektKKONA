import notificationModel from "../models/notificationModel.js";

// ✅ Načíst notifikace přihlášeného uživatele (stránkované, nejnovější první)
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const [notifications, total, unreadCount] = await Promise.all([
      notificationModel
        .find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      notificationModel.countDocuments({ recipient: userId }),
      notificationModel.countDocuments({ recipient: userId, read: false }),
    ]);

    return res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("❌ getMyNotifications error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Počet nepřečtených (lehký endpoint pro badge)
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationModel.countDocuments({
      recipient: req.userId,
      read: false,
    });
    return res.json({ success: true, unreadCount: count });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Označit jednu notifikaci jako přečtenou
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await notificationModel.findOneAndUpdate(
      { _id: notificationId, recipient: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notifikace nenalezena" });
    }
    return res.json({ success: true, notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Označit všechny jako přečtené
export const markAllAsRead = async (req, res) => {
  try {
    await notificationModel.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );
    return res.json({ success: true, message: "Všechny notifikace označeny jako přečtené" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
