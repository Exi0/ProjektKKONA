import inzeratChangeRequestModel from "../models/inzeratChangeRequest.js";
import inzeratModel from "../models/inzeratModel.js";

export const requestInzeratChange = async (req, res, next) => {
  try {
    const { inzeratId, newData } = req.body;
    const userId = req.userId;

    if (!inzeratId || !newData || Object.keys(newData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nejsou žádné změny k uložení"
      });
    }

    await inzeratChangeRequestModel.create({
      inzeratId,
      userId,
      newData
    });

    await inzeratModel.findByIdAndUpdate(
      inzeratId,
      {
        stav: "Čeká na schválení",
        $push: {
          statusHistory: {
            stav: "Čeká na schválení",
            date: new Date()
          }
        }
      },
      { runValidators: false } // ⬅️ NAPROSTO ZÁSADNÍ
    );

    res.json({
      success: true,
      message: "Změny byly odeslány ke schválení"
    });
  } catch (err) {
    console.error("❌ requestInzeratChange ERROR:", err);
    return next(err);
  }
};


export const approveInzeratChange = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await inzeratChangeRequestModel.findById(requestId);
    if (!request || request.status !== "pending") {
      return res.json({ success: false, message: "Neplatná žádost" });
    }

    // 🔥 propsání změn do inzerátu
    await inzeratModel.findByIdAndUpdate(
      request.inzeratId,
      {
        $set: request.newData,
        stav: "Veřejný",
        $push: {
          statusHistory: { stav: "Veřejný" }
        }
      }
    );

    request.status = "approved";
    await request.save();

    res.json({
      success: true,
      message: "Změny inzerátu byly schváleny"
    });
  } catch (err) {
    return next(err);
  }
};
export const rejectInzeratChange = async (req, res, next) => {
  try {
    const { requestId } = req.body;

    const request = await inzeratChangeRequestModel.findById(requestId);
    if (!request) {
      return res.json({ success: false, message: "Žádost nenalezena" });
    }

    request.status = "rejected";
    await request.save();

    // vrátíme inzerát zpět do veřejného stavu
    await inzeratModel.findByIdAndUpdate(request.inzeratId, {
      stav: "Veřejný"
    });

    res.json({
      success: true,
      message: "Změny byly zamítnuty"
    });
  } catch (err) {
    return next(err);
  }
};
export const getPendingInzeratChanges = async (req, res, next) => {
  const requests = await inzeratChangeRequestModel.find({ status: "pending" })
    .populate("inzeratId", "nadpis popis kategorie ukon cenaPerHa ha cenaType stat kraj mesto parcelLink")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    requests: requests.map(r => ({
      ...r.toObject(),
      inzerat: r.inzeratId,
      user: r.userId
    }))
  });
};
export const getInzeratChangeDetail = async (req, res, next) => {
  try {
    const { requestId } = req.params;

    // 1️⃣ najdi change request
    const changeRequest = await inzeratChangeRequestModel
      .findById(requestId)
      .populate("userId", "name email");
    if (!changeRequest) {
      return res.json({
        success: false,
        message: "Žádost nenalezena"
      });
    }

    // 2️⃣ načti inzerát
    const inzerat = await inzeratModel.findById(changeRequest.inzeratId);

    if (!inzerat) {
      return res.json({
        success: false,
        message: "Inzerát nenalezen"
      });
    }
    // 3️⃣ vrať oboje
    res.json({
      success: true,
      inzerat,
      newData: changeRequest.newData,
      user: changeRequest.userId,
      requestMeta: {
        requestId: changeRequest._id,
        status: changeRequest.status,
        createdAt: changeRequest.createdAt
      }
    });
  } catch (err) {
    console.error("❌ getInzeratChangeDetail ERROR:", err);
    return next(err);
  }
};
