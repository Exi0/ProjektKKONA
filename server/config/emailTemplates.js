export const EMAIL_VERIFY_TEMPLATE = `
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
    <tr>
      <td align="center" style="padding:30px;">
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#2f855a" style="padding:20px;color:#fff;">
              <h1 style="margin:0;font-size:24px;">✅ Ověření e-mailu</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;color:#333;">
              <p style="font-size:16px;">Dobrý den,</p>
              <p style="font-size:16px;">Pro dokončení registrace ověřte e-mailovou adresu <strong style="color:#2f855a;">{{email}}</strong>.</p>
              <p style="font-size:16px;">Váš ověřovací kód je:</p>
              <div style="margin:20px auto;display:inline-block;padding:12px 28px;background:#2f855a;color:#fff;border-radius:8px;font-size:20px;font-weight:bold;letter-spacing:2px;">
                {{otp}}
              </div>
              <p style="font-size:14px;color:#777;margin-top:20px;">Kód je platný 24 hodin.</p>
              <p style="font-size:12px;color:#aaa;margin-top:30px;">Tento e-mail byl automaticky vygenerován systémem AgroZakazky.cz</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;

export const PASSWORD_RESET_TEMPLATE = `
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
    <tr>
      <td align="center" style="padding:30px;">
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#2f855a" style="padding:20px;color:#fff;">
              <h1 style="margin:0;font-size:24px;">🔒 Obnovení hesla</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;color:#333;">
              <p style="font-size:16px;">Obdrželi jsme žádost o obnovení hesla pro účet <strong style="color:#2f855a;">{{email}}</strong>.</p>
              <p style="font-size:16px;">Pro pokračování použijte následující kód:</p>
              <div style="margin:20px auto;display:inline-block;padding:12px 28px;background:#eab308;color:#fff;border-radius:8px;font-size:20px;font-weight:bold;letter-spacing:2px;">
                {{otp}}
              </div>
              <p style="font-size:14px;color:#777;margin-top:20px;">Kód je platný 15 minut.</p>
              <p style="font-size:12px;color:#aaa;margin-top:30px;">Tento e-mail byl automaticky vygenerován systémem AgroZakazky.cz</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;

export const NEW_INTEREST_TEMPLATE = `
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
    <tr>
      <td align="center" style="padding:30px;">
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#2f855a" style="padding:20px;color:#fff;">
              <h1 style="margin:0;font-size:24px;">📢 Nový zájem o váš inzerát</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;color:#333;">
              <p style="font-size:16px;">
                Uživatel <strong>{{userName}}</strong> (<a href="mailto:{{userEmail}}" style="color:#2f855a;">{{userEmail}}</a>)
                projevil zájem o váš inzerát <strong>{{adTitle}}</strong>.
              </p>
              <a href="{{adLink}}" style="display:inline-block;margin-top:20px;padding:12px 28px;
                                          background:#2f855a;color:#fff;text-decoration:none;
                                          border-radius:8px;font-weight:bold;">🔗 Zobrazit inzerát</a>
              <p style="font-size:12px;color:#aaa;margin-top:30px;">Tento e-mail byl automaticky vygenerován systémem AgroZakazky.cz</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;


export const REMOVE_INTEREST_TEMPLATE = `
<body style="margin:0;padding:0;background:#f4f7f9;font-family:Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" bgcolor="#f4f7f9">
    <tr>
      <td align="center" style="padding:30px;">
        <table width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
               style="border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;">
          <tr>
            <td align="center" bgcolor="#b91c1c" style="padding:20px;color:#fff;">
              <h1 style="margin:0;font-size:24px;">ℹ️ Uživatel odebral zájem</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;color:#333;">
              <p style="font-size:16px;">
                Uživatel <strong>{{userName}}</strong> (<a href="mailto:{{userEmail}}" style="color:#b91c1c;">{{userEmail}}</a>)
                odebral zájem o inzerát <strong>{{adTitle}}</strong>.
              </p>
              <a href="{{adLink}}" style="display:inline-block;margin-top:20px;padding:12px 28px;
                                          background:#b91c1c;color:#fff;text-decoration:none;
                                          border-radius:8px;font-weight:bold;">🔗 Otevřít inzerát</a>
              <p style="font-size:12px;color:#aaa;margin-top:30px;">Tento e-mail byl automaticky vygenerován systémem AgroZakazky.cz</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>`;
export const NEWUSER_TEMPLATE = `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Vítejte na AgroZakazky.cz</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f7f9;
      font-family: 'Open Sans', sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: #2f855a;
      color: white;
      padding: 25px;
      text-align: center;
    }
    .content {
      padding: 30px;
      color: #333;
      text-align: center;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      background: #2f855a;
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: bold;
      transition: 0.2s ease-in-out;
    }
    .button:hover {
      background: #276749;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌾 Vítejte na AgroZakazky</h1>
    </div>
    <div class="content">
      <p>Dobrý den, <strong>{{name}}</strong> 👋</p>
      <p>Děkujeme za registraci na AgroZakazky! <br/>
         Teď už vám nic nebrání začít inzerovat nebo hledat služby zemědělců po celé republice.</p>

      <div class="footer">
        <p>Pokud jste se neregistrovali vy, tento e-mail můžete ignorovat.</p>
        <p>Tým AgroZakazky © ${new Date().getFullYear()}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
export const PROFILE_CHANGE_USER_TEMPLATE = (user) => `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Změna profilu – čeká na schválení</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f7f9;
      font-family: 'Open Sans', sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: #2f855a;
      color: white;
      padding: 25px;
      text-align: center;
    }
    .content {
      padding: 30px;
      color: #333;
      text-align: center;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📬 Žádost o změnu profilu přijata</h2>
    </div>
    <div class="content">
      <p>Dobrý den, <strong>${user.name}</strong>,</p>

      <p>Vaše žádost o změnu profilu byla úspěšně přijata.</p>
      <p>Změny budou aplikovány až po schválení administrátorem.</p>

      <div class="footer">
        <p>Tým AgroZakazky © ${new Date().getFullYear()}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
export const PROFILE_CHANGE_ADMIN_TEMPLATE = (user, diffHTML) => `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Nová žádost o změnu profilu – AgroZakazky.cz</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f4f7f9;
      font-family: 'Open Sans', sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: #2f855a;
      color: white;
      padding: 25px;
      text-align: center;
    }
    .content {
      padding: 30px;
      color: #333;
    }
    .diff-box {
      background: #f0fff4;
      border-left: 4px solid #2f855a;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      margin: 20px 0;
      background: #2f855a;
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: bold;
      transition: 0.2s ease-in-out;
    }
    .button:hover {
      background: #276749;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
      text-align: center;
      padding-bottom: 20px;
    }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📝 Nová žádost o změnu profilu</h2>
    </div>

    <div class="content">
      <p>Dobrý den,</p>

      <p>Uživatel <strong>${user.name}</strong> (${user.email}) požádal o aktualizaci svého profilu.</p>

      <h3>🔍 Přehled změn:</h3>

      <div class="diff-box">
        ${diffHTML}
      </div>

      <a class="button" href="${process.env.FRONTEND_URL}/admin/profile-changes">
        Otevřít schvalování
      </a>

      <div class="footer">
        <p>Tým AgroZakazky.cz © ${new Date().getFullYear()}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
