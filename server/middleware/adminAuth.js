import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const adminAuth = async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: "Nejste přihlášený" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "Uživatel nenalezen" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění k této akci" });
    }

    req.user = user;               // plný dokument pro admin controllery
    req.userId = user._id.toString(); // ✅ sjednocení s userAuth
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Neplatný nebo expirovaný token" });
  }
};

export default adminAuth;