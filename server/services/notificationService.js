// services/notificationService.js
import notificationModel from "../models/notificationModel.js";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";

/**
 * Vytvoří in-app notifikaci a volitelně pošle e-mail.
 *
 * @param {Object} opts
 * @param {string}  opts.recipientId  - MongoDB _id příjemce
 * @param {string}  opts.type         - typ notifikace (viz enum v modelu)
 * @param {string}  opts.title        - krátký nadpis (max 200 znaků)
 * @param {string}  opts.message      - delší popis (max 500 znaků)
 * @param {string}  [opts.link]       - relativní URL (např. "/inzerat/abc123")
 * @param {boolean} [opts.sendEmail=true]  - poslat i e-mail?
 * @param {string}  [opts.emailSubject]    - předmět e-mailu (default = title)
 * @returns {Promise<Object>} vytvořená notifikace
 */
export const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  link = "",
  sendEmail = true,
  emailSubject,
}) => {
  // 1) Uložit do DB
  const notification = await notificationModel.create({
    recipient: recipientId,
    type,
    title,
    message,
    link,
  });

  // 2) Volitelně odeslat e-mail
  if (sendEmail) {
    try {
      const user = await userModel.findById(recipientId).select("email name isAccountVerified");
      // e-mail posíláme jen ověřeným uživatelům
      if (user?.email && user.isAccountVerified) {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const fullLink = link ? `${frontendUrl}${link}` : frontendUrl;

        await transporter.sendMail({
          from: `"AgroZakázky" <${process.env.SENDER_EMAIL}>`,
          to: user.email,
          subject: emailSubject || title,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:30px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <div style="background:#2f855a;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0;text-align:center;">
                <h2 style="margin:0;font-size:18px;">${title}</h2>
              </div>
              <div style="padding:20px;">
                <p style="color:#333;font-size:15px;line-height:1.6;">${message}</p>
                ${link ? `
                  <div style="text-align:center;margin-top:20px;">
                    <a href="${fullLink}"
                       style="display:inline-block;padding:10px 24px;background:#2f855a;color:#fff;
                              text-decoration:none;border-radius:6px;font-weight:bold;">
                      Zobrazit →
                    </a>
                  </div>
                ` : ""}
              </div>
              <p style="text-align:center;color:#999;font-size:11px;margin-top:16px;">
                AgroZakázky · automatická notifikace
              </p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      // E-mail selhání nesmí shodit celý request — notifikace v DB je důležitější
      console.error("⚠️ Notification email failed:", emailErr.message);
    }
  }

  return notification;
};
