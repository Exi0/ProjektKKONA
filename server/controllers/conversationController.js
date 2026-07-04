import conversationModel from "../models/conversationModel.js";
import messageModel from "../models/messageModel.js";
// ✅ Start conversation
export const startConversation = async (req, res) => {
  try {
    const { inzeratId, otherUserId, text,userId } = req.body

    // 1) najít nebo vytvořit konverzaci
    let conv = await conversationModel.findOne({
      inzerat: inzeratId,
      participants: { $all: [userId, otherUserId] }
    });

    if (!conv) {
      conv = new conversationModel({
        inzerat: inzeratId,
        participants: [userId, otherUserId],
      });
      await conv.save();
    }

    // 2) přidat první zprávu
    let msg = null;
    if (text && text.trim()) {
      msg = new messageModel({
        conversation: conv._id,
        sender: userId,
        text,
      });
      await msg.save();

      conv.lastMessage = msg.text;
      conv.updatedAt = new Date();
      await conv.save();
    }

    res.json({ success: true, conversation: conv, firstMessage: msg });
  } catch (err) {
    console.error("❌ startConversation error:", err);
    res.status(500).json({ success: false, message: "Chyba při založení konverzace" });
  }
};

// ✅ Get all conversations for logged user
export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const convs = await conversationModel
      .find({ participants: userId })
      .populate("participants", "name email avatarPath")
      .populate("inzerat", "nadpis");

    res.json({ success: true, conversations: convs });
  } catch (err) {
    console.error("❌ getUserConversations error:", err);
    res.status(500).json({ success: false, message: "Chyba při načítání konverzací" });
  }
};
