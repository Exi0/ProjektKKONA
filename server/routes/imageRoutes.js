// server/routes/imageRoutes.js
import express from 'express';
import { uploadImages, getPendingImages, approveImage, rejectImage } from '../controllers/imageController.js';
import { upload } from '../middleware/multer.js';
import userAuth from '../middleware/userAuth.js';
import adminAuth from '../middleware/adminAuth.js';
import imageModel from '../models/imageModel.js';
import inzeratModel from '../models/inzeratModel.js';
import userModel from '../models/userModel.js';
import fs from 'fs';
import path from 'path';

const imageRouter = express.Router();

// ✅ FIX: upload nyní vyžaduje přihlášení (dříve mohl nahrávat kdokoliv)
// `files` je název pole ve FormData a max. 10 souborů
imageRouter.post('/upload-multiple', userAuth, upload.array('files', 10), uploadImages);

// ✅ FIX: schvalování obrázků je admin akce → adminAuth místo userAuth
// (dříve si mohl běžný uživatel schválit vlastní obrázky)
imageRouter.get('/getPendingImages', adminAuth, getPendingImages);
imageRouter.post('/approveImage/:imageId', adminAuth, approveImage);
imageRouter.delete('/rejectImage/:imageId', adminAuth, rejectImage);

// ✅ FIX: přidán userAuth (konzistentní s getInzerat, který také vyžaduje login)
imageRouter.get('/byInzerat/:inzeratId', userAuth, async (req, res) => {
  try {
    const images = await imageModel.find({ inzerat: req.params.inzeratId });

    // Přidej fullUrl ke každému obrázku
    const enhancedImages = images.map(img => ({
      ...img._doc,
      fullUrl: `${process.env.BACKEND_URL}/${img.path.replace(/\\/g, '/')}`
    }));

    res.json({ success: true, images: enhancedImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ FIX: mazání obrázku vyžaduje přihlášení + kontrolu vlastnictví
// (dříve mohl kdokoliv smazat jakýkoliv obrázek podle ID)
imageRouter.delete('/:imageId', userAuth, async (req, res) => {
  try {
    const image = await imageModel.findById(req.params.imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Obrázek nenalezen' });
    }

    // 🔒 Zjisti vlastníka obrázku:
    //  - obrázek profilu/galerie má `user`
    //  - obrázek inzerátu má `inzerat` → vlastník je autor inzerátu
    let ownerId = image.user ? image.user.toString() : null;
    if (!ownerId && image.inzerat) {
      const inzerat = await inzeratModel.findById(image.inzerat).select('user');
      ownerId = inzerat?.user?.toString() || null;
    }

    // 🔒 Povolit jen vlastníkovi nebo adminovi
    const requester = await userModel.findById(req.userId).select('role');
    const isAdmin = requester?.role === 'admin';
    if (!isAdmin && (!ownerId || ownerId !== req.userId)) {
      return res.status(403).json({ success: false, message: 'Nemáte oprávnění smazat tento obrázek' });
    }

    await imageModel.findByIdAndDelete(image._id);

    // Normalizace cesty a smazání souboru z disku
    // 🔒 path.basename = ochrana proti path traversal, soubor vždy hledáme jen v uploads/
    const fileName = path.basename(image.path.replace(/\\/g, '/'));
    const filePath = path.resolve('uploads', fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.json({ success: true, message: 'Obrázek odstraněn' });
  } catch (err) {
    console.error('❌ Chyba při mazání obrázku:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default imageRouter;
