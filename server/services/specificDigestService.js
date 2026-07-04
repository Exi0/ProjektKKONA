import transporter from "../config/nodemailer.js";
import inzeratModel from "../models/inzeratModel.js";
import userModel from "../models/userModel.js";

export const sendSpecificWeeklyDigest = async () => {
  // 🎯 Najdi inzeráty za posledních 7 dní
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 365);

  const newInzeraty = await inzeratModel
    .find({ createdAt: { $gte: oneWeekAgo } })
    .populate("user", "name email");

  if (!newInzeraty.length) {
    console.log("❌ Žádné nové inzeráty tento týden.");
    return;
  }

  // 🧠 Načti uživatele, kteří mají specializaci
  const users = await userModel.find({ specializace: { $exists: true, $ne: [] } });

  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  for (const user of users) {
    // ✳️ Filtruj inzeráty podle uživatelových specializací
    const relevantInzeraty = newInzeraty.filter(i =>
      user.specializace.some(spec => i.kategorie?.includes(spec))
    );

    if (!relevantInzeraty.length) {
      console.log(`⏩ Žádné relevantní inzeráty pro ${user.email}`);
      continue;
    }

    // 🖋️ Vytvoř obsah HTML
    const htmlContent = `
      <body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
        <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
          <tr>
            <td align="center" style="padding:30px;">
              <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
                     style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
                <tr>
                  <td align="center" bgcolor="#2f855a" style="padding:20px;color:#fff;">
                    <h1 style="margin:0;font-size:24px;">🌾 Přehled nových inzerátů pro vaše specializace</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px;">
                    <p style="font-size:16px;color:#333;text-align:center;">
                      Dobrý den, ${user.name || "farmáři"}! Přinášíme ti nové inzeráty odpovídající tvému zaměření 👇
                    </p>

                    ${relevantInzeraty
                      .map(
                        (i) => `
                        <div style="margin:20px 0;padding:20px;border:1px solid #eee;
                                    border-radius:8px;text-align:center;background:#f9fdf9;">
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
                      Tento e-mail byl automaticky vygenerován systémem AgroMarket.cz<br/>
                      <em>Na základě vašich specializací: ${user.specializace.join(", ")}</em>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    `;

    // 📤 Pošli e-mail
    try {
      await transporter.sendMail({
        from: '"ProjektKKonaTinder" <patkohrabcak@gmail.com>',
        to: user.email,
        subject: `🌱 Nové nabídky pro vaše specializace (${relevantInzeraty.length})`,
        html: htmlContent,
      });

      console.log(`✅ Digest odeslán pro ${user.email} (${relevantInzeraty.length} inzerátů)`);
    } catch (err) {
      console.error(`❌ Chyba při odesílání digestu ${user.email}:`, err.message);
    }
  }
};
