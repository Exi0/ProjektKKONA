import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";

// ═══════════════════════════════════════════════════════════════════
// 1) Tlačítko "Uložit hledání"
// ═══════════════════════════════════════════════════════════════════
export const SaveSearchButton = ({ filters = {} }) => {
  const { backendUrl } = useContext(AppContent);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/saved-searches`,
        filters,
        { withCredentials: true }
      );
      if (data.success) {
        setJustSaved(true);
        toast.success("Hledání uloženo — budete dostávat alerty");
        setTimeout(() => setJustSaved(false), 3000);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Nepodařilo se uložit");
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = Object.values(filters).some(
    (v) => v !== "" && v !== null && v !== undefined
  );
  if (!hasFilters) return null;

  return (
    <button
      onClick={handleSave}
      disabled={saving || justSaved}
      className={`
        group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        shadow-sm border transition-all duration-300
        ${justSaved
          ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default"
          : "bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 hover:shadow-md active:scale-[0.97]"
        }
        disabled:opacity-70
      `}
    >
      <span className={`text-base transition-transform duration-300 ${justSaved ? "scale-110" : "group-hover:scale-110 group-hover:rotate-12"}`}>
        {justSaved ? "✅" : "🔔"}
      </span>
      <span>{saving ? "Ukládám…" : justSaved ? "Uloženo!" : "Uložit hledání"}</span>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════
// 2) Grid seznam — 5 sloupců, info pod sebou, zvonek + koš
// ═══════════════════════════════════════════════════════════════════
export const SavedSearchesList = () => {
  const { backendUrl } = useContext(AppContent);
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearches = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/saved-searches`, {
        withCredentials: true,
      });
      if (data.success) setSearches(data.savedSearches);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSearches(); }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/saved-searches/${id}`, { withCredentials: true });
      setSearches((prev) => prev.filter((s) => s._id !== id));
      toast.success("Hledání odstraněno");
    } catch { toast.error("Chyba při mazání"); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(
        `${backendUrl}/api/saved-searches/${id}/toggle-alert`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        setSearches((prev) =>
          prev.map((s) => (s._id === id ? { ...s, alertEnabled: data.alertEnabled } : s))
        );
        toast.success(data.alertEnabled ? "Alert zapnut" : "Alert vypnut");
      }
    } catch { toast.error("Chyba"); }
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(new Date(d));

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!searches.length) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">🔍</span>
        <p className="text-gray-500 font-medium">Žádná uložená hledání</p>
        <p className="text-sm text-gray-400 mt-1">
          Nastavte filtry na stránce zakázek a klikněte „Uložit hledání"
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Uložená hledání</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {searches.length} / 10
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {searches.map((s) => (
          <div
            key={s._id}
            className={`
              relative flex flex-col rounded-2xl border p-4 transition-all duration-200 min-h-[200px]
              ${s.alertEnabled
                ? "bg-white border-green-200 shadow-sm hover:shadow-lg hover:border-green-300"
                : "bg-gray-50 border-gray-200 hover:bg-white hover:shadow-md"
              }
            `}
          >
            {/* Název */}
            <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-3">
              {s.name}
            </p>

            {/* Info pod sebou */}
            <div className="flex-1 space-y-1.5 text-xs">
              {s.kategorie && (
                <div className="flex items-center gap-1.5 text-green-700">
                  <span>🌾</span>
                  <span className="truncate">{s.kategorie}</span>
                </div>
              )}
              {s.ukon && (
                <div className="flex items-center gap-1.5 text-blue-700">
                  <span>⚙️</span>
                  <span className="truncate">{s.ukon}</span>
                </div>
              )}
              {s.kraj && (
                <div className="flex items-center gap-1.5 text-amber-700">
                  <span>📍</span>
                  <span className="truncate">{s.kraj}</span>
                </div>
              )}
              {s.search && (
                <div className="flex items-center gap-1.5 text-gray-600">
                  <span>🔎</span>
                  <span className="truncate">„{s.search}"</span>
                </div>
              )}
              {(s.minCena != null || s.maxCena != null) && (
                <div className="flex items-center gap-1.5 text-purple-700">
                  <span>💰</span>
                  <span>{s.minCena ?? 0}–{s.maxCena ?? "∞"} Kč</span>
                </div>
              )}
              {/* Pokud žádný specifický filtr, ukaž "Vše" */}
              {!s.kategorie && !s.ukon && !s.kraj && !s.search && s.minCena == null && s.maxCena == null && (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span>📋</span>
                  <span>Všechny zakázky</span>
                </div>
              )}
            </div>

            {/* Datum */}
            <p className="text-[10px] text-gray-400 mt-2">{formatDate(s.createdAt)}</p>

            {/* Spodní lišta: zvonek + koš */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => handleToggle(s._id)}
                title={s.alertEnabled ? "Vypnout alert" : "Zapnout alert"}
                className={`
                  p-2 rounded-xl transition-all duration-200
                  ${s.alertEnabled
                    ? "bg-green-100 text-green-600 hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  {s.alertEnabled ? (
                    <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5ZM12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25Z" />
                  ) : (
                    <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-1.735-1.735a24.802 24.802 0 0 0 2.024-.707.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 9.395 2.747l-5.865-5.866ZM5.25 9c0-.38.032-.753.093-1.118L15.81 18.35a24.575 24.575 0 0 1-3.81.31 3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Z" />
                  )}
                </svg>
              </button>

              <button
                onClick={() => handleDelete(s._id)}
                title="Smazat hledání"
                className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
