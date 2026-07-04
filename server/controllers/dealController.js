// controllers/dealController.js
import inzeratModel from "../models/inzeratModel.js";
import userModel from "../models/userModel.js";
import { createNotification } from "../services/notificationService.js";

// ── Helpers ────────────────────────────────────────────────────────
const pushStatus = (inzerat, stav, note = "") => {
  inzerat.statusHistory.push({ stav, date: new Date(), note });
  inzerat.stav = stav;
};

const isOwner = (inzerat, userId) =>
  inzerat.user._id?.toString() === userId || inzerat.user.toString() === userId;

const isWinner = (inzerat, userId) =>
  inzerat.winner?._id?.toString() === userId || inzerat.winner?.toString() === userId;


// ═══════════════════════════════════════════════════════════════════
// 1) NAVRHNOUT PODMÍNKY (owner nebo winner — první krok po selectWinner)
//    Kdo navrhuje, ten automaticky i potvrzuje.
// ═══════════════════════════════════════════════════════════════════
export const proposeTerms = async (req, res) => {
  try {
    const { inzeratId, agreedPrice, agreedDate, agreedNote } = req.body;
    const userId = req.userId;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user", "name email");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    if (!inzerat.winner) {
      return res.status(400).json({ success: false, message: "Zatím nebyl vybrán vítěz" });
    }

    const amOwner = isOwner(inzerat, userId);
    const amWinner = isWinner(inzerat, userId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    // Nastavit podmínky
    inzerat.deal.agreedPrice = agreedPrice ?? inzerat.cenaPerHa;
    inzerat.deal.agreedDate = agreedDate || null;
    inzerat.deal.agreedNote = (agreedNote || "").slice(0, 500);

    // Kdo navrhuje, ten potvrzuje
    if (amOwner) {
      inzerat.deal.ownerConfirmed = true;
      inzerat.deal.ownerConfirmedAt = new Date();
      inzerat.deal.winnerConfirmed = false; // druhá strana musí potvrdit nové podmínky
    } else {
      inzerat.deal.winnerConfirmed = true;
      inzerat.deal.winnerConfirmedAt = new Date();
      inzerat.deal.ownerConfirmed = false;
    }

    // Pokud stav ještě není "Domluveno", posuň ho tam
    if (inzerat.stav === "Veřejný" || inzerat.stav === "Domluveno") {
      pushStatus(inzerat, "Domluveno", "Navrženy podmínky");
    }

    await inzerat.save();

    // Notifikace druhé straně
    const recipientId = amOwner ? inzerat.winner.toString() : inzerat.user._id.toString();
    await createNotification({
      recipientId,
      type: "system",
      title: "Nové podmínky zakázky",
      message: `Byly navrženy podmínky pro „${inzerat.nadpis}". Zkontrolujte je a potvrďte.`,
      link: `/inzerat/${inzeratId}`,
      sendEmail: true,
      emailSubject: "📋 Nové podmínky zakázky ke schválení",
    });

    return res.json({ success: true, message: "Podmínky navrženy", inzerat });
  } catch (err) {
    console.error("❌ proposeTerms error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
// 2) POTVRDIT PODMÍNKY (druhá strana)
//    Jakmile obě strany potvrdí → stav "Probíhá"
// ═══════════════════════════════════════════════════════════════════
export const confirmTerms = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const userId = req.userId;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user", "name email");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    const amOwner = isOwner(inzerat, userId);
    const amWinner = isWinner(inzerat, userId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    if (amOwner) {
      inzerat.deal.ownerConfirmed = true;
      inzerat.deal.ownerConfirmedAt = new Date();
    } else {
      inzerat.deal.winnerConfirmed = true;
      inzerat.deal.winnerConfirmedAt = new Date();
    }

    // Obě strany potvrdily → "Probíhá"
    if (inzerat.deal.ownerConfirmed && inzerat.deal.winnerConfirmed) {
      pushStatus(inzerat, "Probíhá", "Obě strany potvrdily podmínky");

      // Notifikace oběma
      const ownerId = inzerat.user._id.toString();
      const winnerId = inzerat.winner.toString();
      const msg = `Podmínky zakázky „${inzerat.nadpis}" byly potvrzeny oběma stranami. Práce může začít!`;
      for (const rid of [ownerId, winnerId]) {
        await createNotification({
          recipientId: rid,
          type: "system",
          title: "Zakázka potvrzena – práce může začít",
          message: msg,
          link: `/inzerat/${inzeratId}`,
          sendEmail: true,
          emailSubject: "🤝 Zakázka potvrzena",
        });
      }
    } else {
      // Notifikace druhé straně
      const recipientId = amOwner ? inzerat.winner.toString() : inzerat.user._id.toString();
      await createNotification({
        recipientId,
        type: "system",
        title: "Podmínky potvrzeny protistranou",
        message: `Podmínky zakázky „${inzerat.nadpis}" potvrdila jedna strana. Čeká se na vaše potvrzení.`,
        link: `/inzerat/${inzeratId}`,
        sendEmail: false,
      });
    }

    await inzerat.save();

    return res.json({ success: true, message: "Podmínky potvrzeny", inzerat });
  } catch (err) {
    console.error("❌ confirmTerms error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
// 3) OZNAČIT JAKO HOTOVÉ (dodavatel nebo objednatel)
// ═══════════════════════════════════════════════════════════════════
export const markComplete = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const userId = req.userId;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user", "name email");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    if (inzerat.stav !== "Probíhá") {
      return res.status(400).json({ success: false, message: "Zakázka není ve stavu 'Probíhá'" });
    }

    const amOwner = isOwner(inzerat, userId);
    const amWinner = isWinner(inzerat, userId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    inzerat.deal.markedCompleteBy = amWinner ? "winner" : "owner";
    inzerat.deal.markedCompleteAt = new Date();
    pushStatus(inzerat, "Čeká na potvrzení dokončení",
      `Dokončení nahlásil ${amWinner ? "dodavatel" : "objednatel"}`);

    await inzerat.save();

    // Notifikace druhé straně – potvrďte, že práce je hotová
    const recipientId = amOwner ? inzerat.winner.toString() : inzerat.user._id.toString();
    await createNotification({
      recipientId,
      type: "system",
      title: "Zakázka hlášena jako dokončená",
      message: `Protistrana hlásí, že práce na „${inzerat.nadpis}" je hotová. Potvrďte prosím dokončení.`,
      link: `/inzerat/${inzeratId}`,
      sendEmail: true,
      emailSubject: "✅ Potvrďte dokončení zakázky",
    });

    return res.json({ success: true, message: "Zakázka označena jako hotová", inzerat });
  } catch (err) {
    console.error("❌ markComplete error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
// 4) POTVRDIT DOKONČENÍ (druhá strana) → "Dokončeno", odemkne hodnocení
// ═══════════════════════════════════════════════════════════════════
export const confirmCompletion = async (req, res) => {
  try {
    const { inzeratId } = req.body;
    const userId = req.userId;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user", "name email");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    if (inzerat.stav !== "Čeká na potvrzení dokončení") {
      return res.status(400).json({ success: false, message: "Zakázka není ve stavu čekání na potvrzení" });
    }

    const amOwner = isOwner(inzerat, userId);
    const amWinner = isWinner(inzerat, userId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    // Ten kdo potvrzuje NESMÍ být ten, kdo nahlásil dokončení
    const whoMarked = inzerat.deal.markedCompleteBy; // "winner" nebo "owner"
    if ((amWinner && whoMarked === "winner") || (amOwner && whoMarked === "owner")) {
      return res.status(400).json({
        success: false,
        message: "Dokončení musí potvrdit protistrana",
      });
    }

    inzerat.deal.completionConfirmedBy = amWinner ? "winner" : "owner";
    inzerat.deal.completionConfirmedAt = new Date();
    pushStatus(inzerat, "Dokončeno", "Obě strany potvrdily dokončení");

    await inzerat.save();

    // Notifikace oběma — můžete se vzájemně ohodnotit
    const ownerId = inzerat.user._id.toString();
    const winnerId = inzerat.winner.toString();
    for (const rid of [ownerId, winnerId]) {
      await createNotification({
        recipientId: rid,
        type: "system",
        title: "Zakázka dokončena!",
        message: `Zakázka „${inzerat.nadpis}" byla úspěšně dokončena. Nyní můžete ohodnotit protistranu.`,
        link: `/inzerat/${inzeratId}`,
        sendEmail: true,
        emailSubject: "🎉 Zakázka dokončena — ohodnoťte protistranu",
      });
    }

    return res.json({ success: true, message: "Zakázka dokončena!", inzerat });
  } catch (err) {
    console.error("❌ confirmCompletion error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
// 5) NAHLÁSIT SPOR
// ═══════════════════════════════════════════════════════════════════
export const disputeDeal = async (req, res) => {
  try {
    const { inzeratId, reason } = req.body;
    const userId = req.userId;

    const inzerat = await inzeratModel.findById(inzeratId).populate("user", "name email");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    const amOwner = isOwner(inzerat, userId);
    const amWinner = isWinner(inzerat, userId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Nemáte oprávnění" });
    }

    // Spor je možný jen ve fázích po dohodě
    const allowedStates = ["Domluveno", "Probíhá", "Čeká na potvrzení dokončení"];
    if (!allowedStates.includes(inzerat.stav)) {
      return res.status(400).json({
        success: false,
        message: "Spor lze nahlásit jen u probíhající zakázky",
      });
    }

    inzerat.deal.disputeReason = (reason || "Bez udání důvodu").slice(0, 500);
    inzerat.deal.disputeBy = userId;
    inzerat.deal.disputeAt = new Date();
    pushStatus(inzerat, "Sporný", `Spor nahlásil ${amWinner ? "dodavatel" : "objednatel"}`);

    await inzerat.save();

    // Notifikace druhé straně + adminovi by se hodila (zatím druhá strana)
    const recipientId = amOwner ? inzerat.winner.toString() : inzerat.user._id.toString();
    await createNotification({
      recipientId,
      type: "system",
      title: "Nahlášen spor u zakázky",
      message: `U zakázky „${inzerat.nadpis}" byl nahlášen spor: ${inzerat.deal.disputeReason}`,
      link: `/inzerat/${inzeratId}`,
      sendEmail: true,
      emailSubject: "⚠️ Spor u zakázky",
    });

    return res.json({ success: true, message: "Spor nahlášen", inzerat });
  } catch (err) {
    console.error("❌ disputeDeal error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ═══════════════════════════════════════════════════════════════════
// 6) HODNOCENÍ V RÁMCI DEALU (nahrazuje nebo doplňuje stávající addRating)
//    Povoleno jen po "Dokončeno" a jen jednou za stranu.
// ═══════════════════════════════════════════════════════════════════
export const rateDealParticipant = async (req, res) => {
  try {
    const { inzeratId, reliability, communication, quality, comment } = req.body;
    const fromUserId = req.userId;

    // Validace vstupů
    if (![reliability, communication, quality].every((v) => v >= 1 && v <= 5)) {
      return res.status(400).json({ success: false, message: "Hodnocení musí být 1–5" });
    }

    const inzerat = await inzeratModel.findById(inzeratId).populate("user");
    if (!inzerat) return res.status(404).json({ success: false, message: "Inzerát nenalezen" });

    // Jen u dokončených zakázek
    if (inzerat.stav !== "Dokončeno") {
      return res.status(400).json({
        success: false,
        message: "Hodnocení je možné až po dokončení zakázky",
      });
    }

    const amOwner = isOwner(inzerat, fromUserId);
    const amWinner = isWinner(inzerat, fromUserId);
    if (!amOwner && !amWinner) {
      return res.status(403).json({ success: false, message: "Hodnotit může jen účastník zakázky" });
    }

    // Kontrola, že ještě nehodnotil
    if (amOwner && inzerat.deal.ownerRated) {
      return res.status(400).json({ success: false, message: "Již jste tuto zakázku hodnotili" });
    }
    if (amWinner && inzerat.deal.winnerRated) {
      return res.status(400).json({ success: false, message: "Již jste tuto zakázku hodnotili" });
    }

    // Koho hodnotíme? Owner hodnotí winnera, winner hodnotí ownera.
    const targetUserId = amOwner ? inzerat.winner.toString() : inzerat.user._id.toString();
    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ success: false, message: "Hodnocený uživatel nenalezen" });

    // Přidej rating na profil cílového uživatele
    targetUser.ratings.push({
      from: fromUserId,
      reliability,
      communication,
      quality,
      comment: (comment || "").slice(0, 500),
      createdAt: new Date(),
    });
    await targetUser.save();

    // Označ, že tato strana už hodnotila
    if (amOwner) inzerat.deal.ownerRated = true;
    if (amWinner) inzerat.deal.winnerRated = true;
    await inzerat.save();

    // Notifikace hodnocenému
    await createNotification({
      recipientId: targetUserId,
      type: "system",
      title: "Obdrželi jste hodnocení",
      message: `Za zakázku „${inzerat.nadpis}" vás protistrana ohodnotila.`,
      link: `/profil/${targetUserId}`,
      sendEmail: false,
    });

    return res.json({ success: true, message: "Hodnocení přidáno" });
  } catch (err) {
    console.error("❌ rateDealParticipant error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
