// services/digestService.js
import transporter from "../config/nodemailer.js";
import inzeratModel from "../models/inzeratModel.js";
import userModel from "../models/userModel.js";

export const sendWeeklyDigest = async () => {
  // vezmeme nové inzeráty z posledních 7 dnů
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // ✅ FIX: bylo -365 (testovací hodnota)

  // ✅ FIX: posíláme jen veřejné inzeráty, ne rozpracované / čekající na schválení
  const newInzeraty = await inzeratModel
    .find({ createdAt: { $gte: oneWeekAgo }, stav: "Veřejný" })
    .populate("user", "name email");

  if (!newInzeraty.length) {
    console.log("Žádné nové inzeráty tento týden.");
    return;
  }

  // ✅ FIX: jen ověření uživatelé (dřív se posílalo i neověřeným e-mailům)
  const users = await userModel.find({ isAccountVerified: true }).select("email");

  if (!users.length) {
    console.log("Žádní uživatelé k odeslání digestu.");
    return;
  }

  // základní URL frontendu (přizpůsob podle deploy)
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  // vytvoř HTML obsah
  const htmlContent = `
      <body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
        <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
          <tr>
            <td align="center" style="padding:30px;">
              <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
                <tr>
                  <td align="center" bgcolor="#2f855a" style="padding:20px;color:#fff;">
                    <h1 style="margin:0;font-size:24px;">📨 Týdenní přehled inzerátů</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;color:#333;text-align:center;">
                      Dobrý den! Přinášíme ti nové inzeráty za poslední týden 👇
                    </p>

                    ${newInzeraty
                      .map(
                        (i) => `
                        <div style="margin:20px 0;padding:20px;border:1px solid #eee;border-radius:8px;text-align:center;">
                          <h2 style="font-size:20px;margin-bottom:10px;color:#2f855a;">
                            ${i.nadpis}
                          </h2>
                          <p style="margin:5px 0;color:#555;">
                            <strong>Kategorie:</strong> ${i.kategorie || "Neuvedeno"}
                          </p>
                          <p style="margin:5px 0;color:#555;">
                            <strong>Kraj:</strong> ${i.kraj || "Neuvedeno"}
                          </p>
                          <a href="${baseUrl}/inzerat/${i._id}"
                            style="display:inline-block;margin-top:15px;padding:10px 20px;
                                   background:#2f855a;color:#fff;text-decoration:none;
                                   border-radius:6px;font-weight:bold;">
                            👉 Otevřít inzerát
                          </a>
                        </div>
                      `
                      )
                      .join("")}

                    <p style="text-align:center;color:#888;margin-top:30px;font-size:12px;">
                      Tento e-mail byl automaticky vygenerován systémem AgroMarket.cz
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    `;

  // ✅ FIX: jeden e-mail s BCC na všechny, místo smyčky, která posílala
  // všem uživatelům tolik kopií, kolik je uživatelů (N×N e-mailů)
  await transporter.sendMail({
    from: `"AgroMarket" <${process.env.SENDER_EMAIL}>`, // ✅ FIX: odesílatel z env
    to: process.env.SENDER_EMAIL,
    bcc: users.map((u) => u.email),
    subject: "📨 Týdenní přehled nových inzerátů",
    html: htmlContent,
  });

  console.log(`✅ Digest odeslán ${users.length} uživatelům.`);
};
