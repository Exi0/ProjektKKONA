import React, { useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";

// ── Vizuální mapa stavů ────────────────────────────────────────────
const stageConfig = {
  Veřejný: { label: "Hledání dodavatele", color: "bg-blue-100 text-blue-800", step: 1 },
  Domluveno: { label: "Domlouvání podmínek", color: "bg-yellow-100 text-yellow-800", step: 2 },
  Probíhá: { label: "Práce probíhá", color: "bg-green-100 text-green-800", step: 3 },
  "Čeká na potvrzení dokončení": { label: "Čeká na potvrzení", color: "bg-orange-100 text-orange-800", step: 4 },
  Dokončeno: { label: "Dokončeno", color: "bg-emerald-100 text-emerald-800", step: 5 },
  Sporný: { label: "Spor", color: "bg-red-100 text-red-800", step: -1 },
};

const steps = [
  { step: 1, label: "Hledání" },
  { step: 2, label: "Podmínky" },
  { step: 3, label: "Probíhá" },
  { step: 4, label: "Potvrzení" },
  { step: 5, label: "Hotovo" },
];

const unitLabel = { ha: "Kč/ha", h: "Kč/h", t: "Kč/t", kg: "Kč/kg" };

const DealPanel = ({ inzerat, onUpdate }) => {
  const { backendUrl, userData } = useContext(AppContent);
  const [loading, setLoading] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [showTermsForm, setShowTermsForm] = useState(false);

  // form pro podmínky
  const [agreedPrice, setAgreedPrice] = useState(inzerat?.deal?.agreedPrice ?? inzerat?.cenaPerHa ?? "");
  const [agreedDate, setAgreedDate] = useState(
    inzerat?.deal?.agreedDate ? new Date(inzerat.deal.agreedDate).toISOString().split("T")[0] : ""
  );
  const [agreedNote, setAgreedNote] = useState(inzerat?.deal?.agreedNote ?? "");

  // rating form
  const [showRating, setShowRating] = useState(false);
  const [rReliability, setRReliability] = useState(5);
  const [rCommunication, setRCommunication] = useState(5);
  const [rQuality, setRQuality] = useState(5);
  const [rComment, setRComment] = useState("");

  if (!inzerat || !inzerat.winner) return null;

  const userId = userData?.id;
  const amOwner = inzerat.user?._id === userId || inzerat.user === userId;
  const amWinner = inzerat.winner?._id === userId || inzerat.winner === userId;
  if (!amOwner && !amWinner) return null; // panel vidí jen účastníci

  const stav = inzerat.stav;
  const deal = inzerat.deal || {};
  const stage = stageConfig[stav] || { label: stav, color: "bg-gray-100 text-gray-800", step: 0 };
  const currentStep = stage.step;

  // ── API helper ───────────────────────────────────────────────────
  const callApi = async (endpoint, body = {}) => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/deal/${endpoint}`,
        { inzeratId: inzerat._id, ...body },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        if (onUpdate) onUpdate(data.inzerat);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Chyba při zpracování");
    } finally {
      setLoading(false);
    }
  };

  // ── Rating submit ────────────────────────────────────────────────
  const submitRating = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/deal/rate`,
        {
          inzeratId: inzerat._id,
          reliability: rReliability,
          communication: rCommunication,
          quality: rQuality,
          comment: rComment,
        },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Hodnocení přidáno");
        setShowRating(false);
        if (onUpdate) onUpdate(); // refresh
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Chyba při hodnocení");
    } finally {
      setLoading(false);
    }
  };

  // ── Zjisti, co se má zobrazit ────────────────────────────────────
  const myConfirmed = amOwner ? deal.ownerConfirmed : deal.winnerConfirmed;
  const otherConfirmed = amOwner ? deal.winnerConfirmed : deal.ownerConfirmed;
  const alreadyRated = amOwner ? deal.ownerRated : deal.winnerRated;
  const whoMarkedComplete = deal.markedCompleteBy;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Průběh zakázky</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${stage.color}`}>
          {stage.label}
        </span>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      {currentStep > 0 && (
        <div className="flex items-center gap-1 mb-6">
          {steps.map((s) => (
            <div key={s.step} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full h-2 rounded-full ${
                  s.step <= currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
              />
              <span className="text-[10px] text-gray-500 mt-1">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Dohodnuté podmínky (pokud existují) ───────────────────── */}
      {deal.agreedPrice != null && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1 text-sm">
          <p>
            <span className="font-medium text-gray-600">Dohodnutá cena:</span>{" "}
            <span className="font-semibold">
              {deal.agreedPrice} {unitLabel[inzerat.cenaType] || "Kč"}
            </span>
          </p>
          {deal.agreedDate && (
            <p>
              <span className="font-medium text-gray-600">Datum provedení:</span>{" "}
              {new Date(deal.agreedDate).toLocaleDateString("cs-CZ")}
            </p>
          )}
          {deal.agreedNote && (
            <p>
              <span className="font-medium text-gray-600">Poznámka:</span>{" "}
              {deal.agreedNote}
            </p>
          )}
          <div className="flex gap-4 mt-2">
            <span className={`text-xs ${deal.ownerConfirmed ? "text-green-600" : "text-gray-400"}`}>
              {deal.ownerConfirmed ? "✅" : "⏳"} Objednatel
            </span>
            <span className={`text-xs ${deal.winnerConfirmed ? "text-green-600" : "text-gray-400"}`}>
              {deal.winnerConfirmed ? "✅" : "⏳"} Dodavatel
            </span>
          </div>
        </div>
      )}

      {/* ── Spor info ─────────────────────────────────────────────── */}
      {stav === "Sporný" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm">
          <p className="font-medium text-red-800">Důvod sporu:</p>
          <p className="text-red-700 mt-1">{deal.disputeReason || "Neuvedeno"}</p>
          <p className="text-xs text-red-400 mt-2">
            Kontaktujte prosím podporu pro vyřešení.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          AKČNÍ TLAČÍTKA (podle stavu a role)
         ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">

        {/* ── Stav: Veřejný / Domluveno → navrhnout nebo potvrdit podmínky ── */}
        {(stav === "Veřejný" || stav === "Domluveno") && (
          <>
            {/* Formulář pro navržení podmínek */}
            {!showTermsForm ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowTermsForm(true)}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {deal.agreedPrice != null ? "Upravit podmínky" : "Navrhnout podmínky"}
                </button>

                {/* Potvrdit — jen pokud podmínky existují a já jsem je ještě nepotvrdil */}
                {deal.agreedPrice != null && !myConfirmed && (
                  <button
                    onClick={() => callApi("confirm-terms")}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    ✅ Potvrdit podmínky
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Dohodnutá cena ({unitLabel[inzerat.cenaType] || "Kč"})
                    </label>
                    <input
                      type="number"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(Number(e.target.value))}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Datum provedení</label>
                    <input
                      type="date"
                      value={agreedDate}
                      onChange={(e) => setAgreedDate(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Poznámka (volitelná)</label>
                  <textarea
                    value={agreedNote}
                    onChange={(e) => setAgreedNote(e.target.value)}
                    maxLength={500}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      callApi("propose-terms", { agreedPrice, agreedDate: agreedDate || null, agreedNote });
                      setShowTermsForm(false);
                    }}
                    disabled={loading || !agreedPrice}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                  >
                    Odeslat návrh
                  </button>
                  <button
                    onClick={() => setShowTermsForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Stav: Probíhá → označit jako hotové ───────────────────── */}
        {stav === "Probíhá" && (
          <button
            onClick={() => callApi("mark-complete")}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
          >
            ✅ Označit práci jako hotovou
          </button>
        )}

        {/* ── Stav: Čeká na potvrzení dokončení ─────────────────────── */}
        {stav === "Čeká na potvrzení dokončení" && (
          <>
            {/* Potvrzení — jen druhá strana (ne ten kdo nahlásil) */}
            {((amWinner && whoMarkedComplete === "owner") ||
              (amOwner && whoMarkedComplete === "winner")) ? (
              <button
                onClick={() => callApi("confirm-completion")}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm"
              >
                🎉 Potvrdit dokončení
              </button>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Čeká se na potvrzení dokončení od protistrany…
              </p>
            )}
          </>
        )}

        {/* ── Stav: Dokončeno → hodnocení ───────────────────────────── */}
        {stav === "Dokončeno" && !alreadyRated && (
          <>
            {!showRating ? (
              <button
                onClick={() => setShowRating(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm"
              >
                ⭐ Ohodnotit protistranu
              </button>
            ) : (
              <div className="bg-amber-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Hodnocení protistrany</p>
                {[
                  { label: "Spolehlivost", value: rReliability, set: setRReliability },
                  { label: "Komunikace", value: rCommunication, set: setRCommunication },
                  { label: "Kvalita práce", value: rQuality, set: setRQuality },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-28">{label}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => set(star)}
                          className={`text-xl transition ${star <= value ? "text-amber-400" : "text-gray-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{value}/5</span>
                  </div>
                ))}
                <textarea
                  placeholder="Komentář (volitelný)…"
                  value={rComment}
                  onChange={(e) => setRComment(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={submitRating}
                    disabled={loading}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-sm"
                  >
                    Odeslat hodnocení
                  </button>
                  <button
                    onClick={() => setShowRating(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {stav === "Dokončeno" && alreadyRated && (
          <p className="text-sm text-green-600 font-medium">✅ Hodnocení odesláno</p>
        )}

        {/* ── Tlačítko sporu (dostupné v aktivních fázích) ──────────── */}
        {["Domluveno", "Probíhá", "Čeká na potvrzení dokončení"].includes(stav) && (
          <>
            {!showDispute ? (
              <button
                onClick={() => setShowDispute(true)}
                className="text-sm text-red-500 hover:text-red-700 underline"
              >
                Nahlásit problém
              </button>
            ) : (
              <div className="bg-red-50 rounded-lg p-4 space-y-2">
                <textarea
                  placeholder="Popište problém…"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      callApi("dispute", { reason: disputeReason });
                      setShowDispute(false);
                    }}
                    disabled={loading || !disputeReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Odeslat
                  </button>
                  <button
                    onClick={() => setShowDispute(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                  >
                    Zrušit
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DealPanel;
