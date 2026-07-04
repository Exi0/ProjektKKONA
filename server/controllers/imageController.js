import imageModel from "../models/imageModel.js";
import userModel from '../models/userModel.js';
import { createNotification } from "../services/notificationService.js";
import fs from 'fs';

export const uploadImages = async (req, res, next) => {
  try {
    // ✅ FIX: identita vždy z ověřeného tokenu (req.userId z userAuth),
    // NIKDY z req.body – dříve šlo nahrát obrázek (i avatar!) cizímu uživateli
    const userId = req.userId;
    const { inzeratId, type } = req.body;
    const categories = req.body['category'] || req.body['category[]']; // může být string nebo array
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Žádné soubory nebyly nahrány' });
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    }
    const images = await Promise.all(
      files.map(async (file, idx) => {
        // If it's a profile image, update user and delete old file if needed
        if (!inzeratId && type) {
          const field = type === 'avatar' ? 'avatarPath' : 'backgroundPath';
          const oldPath = user[field];
          if (oldPath && fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
          user[field] = file.path;
          await user.save();
        }

        const category = Array.isArray(categories) ? categories[idx] : categories;
        return imageModel.create({
          nazev: file.originalname,
          path: file.path,
          inzerat: inzeratId || null,
          // ✅ FIX: `user` ukládáme vždy (i u obrázků inzerátu) kvůli kontrole
          // vlastnictví při mazání. Galerii to nerozbije – ta filtruje inzerat: null.
          // (Pole `author` odstraněno – nebylo ve schématu, Mongoose ho zahazoval.)
          user: user._id,
          category: category || null
        });
      })
    );

    return res.json({
      success: true,
      message: `${images.length} obrázků nahráno`,
      images,
      ...(type && !inzeratId
        ? {
            updated: {
              [type + 'Path']: user[type + 'Path'].replace(/\\/g, '/')
            }
          }
        : {})
    });
  } catch (err) {
    console.error('❌ CHYBA uploadImages:', err);
    return next(err);
  }
};

export const getPendingImages = async (req, res, next) => {
  try {
    const images = await imageModel
      .find({ approved: false }).sort({ createdAt: -1 });
    res.json({ success: true, images });
  } catch (err) {
    return next(err);
  }
};

/**
 * ✅ Schválit obrázek (pouze admin – viz adminAuth v routes)
 */
export const approveImage = async (req, res, next) => {
  try {
    // ✅ FIX: imageId čteme z URL parametru (route je /approveImage/:imageId),
    // dříve se četl z req.body, který frontend posílat nemusí
    const imageId = req.params.imageId || req.body.imageId;

    const image = await imageModel.findByIdAndUpdate(
      imageId,
      { approved: true },
      { new: true }
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Obrázek nenalezen"
      });
    }

    res.json({
      success: true,
      message: "Obrázek schválen",
      image
    });
    // 📢 Notifikace vlastníkovi obrázku
    if (image.user) {
      await createNotification({
        recipientId: image.user.toString(),
        type: "image_approved",
        title: "Obrázek schválen",
        message: "Váš nahraný obrázek byl schválen a je nyní viditelný.",
        link: "",
        sendEmail: false,
      });
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * ❌ Zamítnout obrázek (pouze admin – viz adminAuth v routes)
 */
export const rejectImage = async (req, res, next) => {
  try {
    const imageId = req.params.imageId;
    const image = await imageModel.findByIdAndDelete(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Obrázek nenalezen"
      });
    }

    // ✅ FIX: smaž i soubor z disku, aby na serveru nezůstávaly osiřelé soubory
    const fileName = image.path.replace(/\\/g, '/').split('/').pop();
    const filePath = `uploads/${fileName}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "Obrázek zamítnut a smazán",
      image
    });
    // 📢 Notifikace vlastníkovi obrázku
    if (image.user) {
      await createNotification({
        recipientId: image.user.toString(),
        type: "image_rejected",
        title: "Obrázek zamítnut",
        message: "Váš nahraný obrázek byl zamítnut moderátorem.",
        link: "",
        sendEmail: false,
      });
    }
  } catch (err) {
    return next(err);
  }
};
