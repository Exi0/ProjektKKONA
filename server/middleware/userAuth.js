import jwt from 'jsonwebtoken';

const userAuth = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Nejste ověření. Přihlašte se znova.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ success: false, message: 'Nejste ověření. Přihlašte se znova.' });
    }
    // ✅ Jediný zdroj pravdy o identitě – z tokenu, ne z req.body.
    // Nastavíme obě konvence, aby controllery používající req.userId
    // i req.user?.id dostaly ověřené ID a nikdy nespadly na req.body.userId.
    req.userId = decoded.id;
    req.user = { id: decoded.id };
    next();
  } catch {
    // Nepropisujeme error.message ven (únik detailů) – jen 401.
    return res.status(401).json({ success: false, message: 'Neplatný nebo expirovaný token.' });
  }
};

export default userAuth;