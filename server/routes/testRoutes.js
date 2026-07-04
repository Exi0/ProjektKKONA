import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { sendWeeklyDigest } from "../services/digestService.js";
import { sendSpecificWeeklyDigest } from "../services/specificDigestService.js";
const router = express.Router();

// ✅ FIX: oba endpointy chráněné adminAuth – dříve mohl KDOKOLIV na internetu
// vyvolat hromadný e-mail všem uživatelům pouhým otevřením URL.
router.get("/test-digest", adminAuth, async (req, res) => {
  try {
    await sendWeeklyDigest();
    res.json({ success: true, message: "Digest poslán" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/test-specific-digest", adminAuth, async (req, res) => {
  try {
    await sendSpecificWeeklyDigest();
    res.json({ success: true, message: "Specifický digest odeslán!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Chyba při odesílání digestu" });
  }
});

export default router;
