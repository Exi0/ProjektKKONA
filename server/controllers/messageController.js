// controllers/messageController.js
import messageModel from "../models/messageModel.js";
import conversationModel from "../models/conversationModel.js";
import { getIO } from "../config/socket.js";

// ✅ Send message + emit via Socket.IO
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const senderId = req.userId;

    // 🔒 Poslat zprávu smí jen účastník konverzace
    const conversation = await conversationModel.findOne({
      _id: conversationId,
      participants: senderId,
    });
    if (!conversation) {
      return res.status(403).json({ success: false, message: "Nemáte přístup do této konverzace" });
    }

    const msg = new messageModel({
      conversation: conversationId,
      sender: senderId,
      text,
      readBy: [senderId],
    });
    await msg.save();

    // Populate sender for frontend
    await msg.populate("sender", "name email avatarPath");

    // Update conversation
    await conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastUpdated: new Date(),
    });

    // ✅ Emit to conversation room
    try {
      const io = getIO();
      io.to(`conv:${conversationId}`).emit("new-message", {
        conversationId,
        message: msg,
      });

      // Also emit conversation update for list views
      const conv = await conversationModel
        .findById(conversationId)
        .populate("participants", "name email avatarPath")
        .populate("inzerat", "nadpis");

      if (conv) {
        conv.participants.forEach((p) => {
          io.to(`conv:${conversationId}`).emit("conversation-updated", {
            conversation: conv,
          });
        });
      }
    } catch (socketErr) {
      // Socket error shouldn't break message saving
      console.warn("Socket emit failed:", socketErr.message);
    }

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error("❌ sendMessage error:", err);
    res.status(500).json({ success: false, message: "Chyba při odeslání zprávy" });
  }
};

// ✅ Get messages for conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.query;
    const messages = await messageModel
      .find({ conversation: conversationId })
      .populate("sender", "name email avatarPath")
      .sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ getMessages error:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání zpráv" });
  }
};

// ✅ Mark messages as read
export const markRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    await messageModel.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );

    // Emit read status
    try {
      const io = getIO();
      io.to(`conv:${conversationId}`).emit("messages-read", {
        conversationId,
        userId: userId.toString(),
      });
    } catch {}

    res.json({ success: true });
  } catch (err) {
    console.error("❌ markRead error:", err);
    res.status(500).json({ success: false, message: "Chyba při označení jako přečtené" });
  }
};
