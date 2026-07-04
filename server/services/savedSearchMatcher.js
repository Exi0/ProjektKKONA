// services/savedSearchMatcher.js
import savedSearchModel from "../models/savedSearchModel.js";
import inzeratModel from "../models/inzeratModel.js";
import userModel from "../models/userModel.js";
import { createNotification } from "../services/notificationService.js";
import transporter from "../config/nodemailer.js";

const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pro každý uložený search najde nové inzeráty od lastNotifiedAt,
 * pošle souhrnný e-mail a in-app notifikaci.
 */
export const processSavedSearches = async () => {
  const searches = await savedSearchModel.find({ alertEnabled: true }).lean();
  if (!searches.length) return;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  let totalSent = 0;

  for (const s of searches) {
    try {
      // Sestav match filtr
      const match = {
        stav: "Veřejný",
        createdAt: { $gt: s.lastNotifiedAt },
      };
      if (s.kategorie) match.kategorie = s.kategorie;
      if (s.ukon) match.ukon = s.ukon;
      if (s.kraj) match.kraj = s.kraj;
      if (s.minCena != null || s.maxCena != null) {
        match.cenaPerHa = {};
        if (s.minCena != null) match.cenaPerHa.$gte = s.minCena;
        if (s.maxCena != null) match.cenaPerHa.$lte = s.maxCena;
      }
      if (s.search && s.search.trim()) {
        const rx = new RegExp(escapeRegex(s.search.trim()), "i");
        match.$or = [{ nadpis: rx }, { popis: rx }, { ukon: rx }];
      }

      const newItems = await inzeratModel
        .find(match, { nadpis: 1, kategorie: 1, ukon: 1, kraj: 1, cenaPerHa: 1, cenaType: 1 })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      if (!newItems.length) continue;

      // Aktualizuj lastNotifiedAt
      await savedSearchModel.findByIdAndUpdate(s._id, { lastNotifiedAt: new Date() });

      // In-app notifikace
      await createNotification({
        recipientId: s.user.toString(),
        type: "system",
        title: `${newItems.length} nových zakázek`,
        message: `Pro „${s.name}" máme ${newItems.length} nových výsledků.`,
        link: "/inzeraty",
        sendEmail: false,
      });

      // E-mail
      const user = await userModel.findById(s.user).select("email name isAccountVerified");
      if (!user?.email || !user.isAccountVerified) continue;

      const unitLabel = { ha: "Kč/ha", h: "Kč/h", t: "Kč/t", kg: "Kč/kg" };
      const listHtml = newItems
        .map(
          (i) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">
              <a href="${frontendUrl}/inzerat/${i._id}" style="color:#2f855a;font-weight:bold;text-decoration:none;">
                ${i.nadpis}
              </a>
              <br><span style="font-size:12px;color:#666;">${i.kategorie} · ${i.kraj} · ${i.cenaPerHa || "—"} ${unitLabel[i.cenaType] || "Kč"}</span>
            </td>
          </tr>`
        )
        .join("");

      await transporter.sendMail({
        from: `"AgroZakázky" <${process.env.SENDER_EMAIL}>`,
        to: user.email,
        subject: `🔔 ${newItems.length} nových zakázek pro „${s.name}"`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;">
            <div style="background:#2f855a;color:#fff;padding:16px;border-radius:8px 8px 0 0;text-align:center;">
              <h2 style="margin:0;font-size:18px;">Nové zakázky pro „${s.name}"</h2>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #eee;border-top:none;">
              ${listHtml}
            </table>
            <p style="text-align:center;margin-top:16px;">
              <a href="${frontendUrl}/inzeraty" style="display:inline-block;padding:10px 24px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
                Zobrazit vše →
              </a>
            </p>
            <p style="text-align:center;color:#999;font-size:11px;margin-top:16px;">
              Tento alert můžete vypnout v nastavení uložených hledání.
            </p>
          </div>
        `,
      });

      totalSent++;
    } catch (err) {
      console.error(`⚠️ SavedSearch ${s._id} failed:`, err.message);
    }
  }

  if (totalSent > 0) console.log(`✅ Saved search alerts: ${totalSent} e-mailů odesláno`);
};
