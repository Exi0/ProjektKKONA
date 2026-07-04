import userModel from '../models/userModel.js';
import transporter from "../config/nodemailer.js";
import ProfileChangeRequest from '../models/ProfileChangesRequest.js';
import { PROFILE_CHANGE_ADMIN_TEMPLATE, PROFILE_CHANGE_USER_TEMPLATE } from '../config/emailTemplates.js';
import fs from "fs";
import path from "path";

export const sendProfileChangeMail = async (adminEmail, user, diffHTML) => {
  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: adminEmail,
      subject: "📝 Nová žádost o změnu profilu",
      html: PROFILE_CHANGE_ADMIN_TEMPLATE(user, diffHTML)
    });

    console.log("✔ Email adminovi odeslán");
  } catch (err) {
    console.error("❌ Chyba při posílání emailu adminovi:", err);
  }
};
export function generateProfileDiffHTML(oldData, newData) {
  let html = "<ul>";

  for (let key in newData) {
    const oldVal = Array.isArray(oldData[key]) ? oldData[key].join(", ") : oldData[key];
    const newVal = Array.isArray(newData[key]) ? newData[key].join(", ") : newData[key];

    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      html += `
        <li style="margin-bottom: 10px;">
          <strong>${key}:</strong><br/>
          <span style="color:#888;">Původní:</span> ${oldVal || "-"}<br/>
          <span style="color:#2b7a0b;">Nové:</span> ${newVal || "-"}
        </li>
      `;
    }
  }

  html += "</ul>";
  return html;
}

export const requestProfileChange = async (req, res) => {
  try {
    const userId = req.userId;
    console.log("Data v požadavku:", req.body);
    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const toArray = (v) => {
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    };

    const newData = {
      name: req.body.name,
      location: req.body.location,
      description: req.body.description,
      phones: toArray(req.body.phone),
      specializace: toArray(req.body.specializace),
    };

    console.log("New Data before save:", newData)

    // Současná data pro porovnání
    const oldData = {
      name: user.name,
      location: user.location,
      description: user.description,
      phones: user.phone || [],
      specializace: user.specializace || []
    };

    const avatarTemp = req.files?.avatar?.[0]?.path || null;
    const backgroundTemp = req.files?.background?.[0]?.path || null;

    // Uložíme request
    const request = await ProfileChangeRequest.create({
      userId,
      newData,
      avatarTemp,
      backgroundTemp,
      status: "pending"
    });

    // 🔍 Vytvoříme HTML souhrn změn
    const diffHTML = generateProfileDiffHTML(oldData, newData);

    // 📬 Pošleme adminovi info
    await sendProfileChangeMail(process.env.ADMIN_EMAIL, user, diffHTML);

    // 📬 Potvrdíme uživateli
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "📬 Žádost o změnu profilu byla přijata",
      html: PROFILE_CHANGE_USER_TEMPLATE(user)
    });

    res.json({ success: true, message: "Change request created" });

  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Failed to create request" });
  }
};

export const approveProfileChange = async (req, res) => {
  try {
    console.log(req.params)
    const  changeId  = req.params.changeId;
    console.log(changeId)
    const request = await ProfileChangeRequest.findById(changeId);
    console.log(request)
    if (!request) return res.json({ success: false, message: "Request not found" });

    const user = await userModel.findById(request.userId);

    // Přesun avataru
    let avatarPath = user.avatarPath;
    if (request.avatarTemp) {
      const newPath = "uploads/avatar/" + path.basename(request.avatarTemp);
      fs.renameSync(request.avatarTemp, newPath);
      avatarPath = newPath;
    }

    // Přesun pozadí
    let backgroundPath = user.backgroundPath;
    if (request.backgroundTemp) {
      const newPath = "uploads/background/" + path.basename(request.backgroundTemp);
      fs.renameSync(request.backgroundTemp, newPath);
      backgroundPath = newPath;
    }

    // update user modelu
    await userModel.findByIdAndUpdate(request.userId, {
      ...request.newData,
      avatarPath,
      backgroundPath
    });

    // smazání requestu
    await ProfileChangeRequest.findByIdAndDelete(changeId);

    // email uživateli
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "✔️ Změny profilu byly schváleny",
      html: `
        <p>Dobrý den ${user.name},</p>
        <p>Vaše změny profilu byly úspěšně schváleny a aplikovány.</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Approval failed" });
  }
};
export const rejectProfileChange = async (req, res) => {
  const changeId = req.params.changeId;
  console.log(changeId)
  const change = await ProfileChangeRequest.findById(changeId);
  if (!change) return res.json({ success: false, message: "Request not found" });

  change.status = "rejected";
  change.resolvedAt = new Date();
  await change.save();

  return res.json({ success: true, message: "Změna byla zamítnuta." });
};
// 🔥 GET všechny pending requesty
export const getPendingProfileRequests = async (req, res) => {
  try {
    const requests = await ProfileChangeRequest.find({ status: "pending" })
      .populate("userId", "name email avatar background");

    return res.json({ success: true, requests });
  } catch (err) {
    console.error("❌ Chyba při načítání requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🔥 GET detail konkrétního requestu
export const getProfileRequestDetail = async (req, res) => {
  try {
    const { changeId } = req.params;

    const request = await ProfileChangeRequest.findById(changeId).populate(
      "userId",
      "name email avatar background location description phones specializace"
    );

    if (!request) {
      return res.json({ success: false, message: "Request not found" });
    }

    // Načteme OLD DATA = data z user modelu
    const user = await userModel.findById(request.userId);

    const oldData = {
      name: user.name,
      location: user.location,
      description: user.description,
      phones: user.phones,
      specializace: user.specializace
    };

    return res.json({
      success: true,
      request: {
        _id: request._id,
        createdAt: request.createdAt,
        status: request.status,
        avatarTemp: request.avatarTemp,
        backgroundTemp: request.backgroundTemp,

        newData: request.newData,
        oldData,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (err) {
    console.error("❌ Chyba detail requestu:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};