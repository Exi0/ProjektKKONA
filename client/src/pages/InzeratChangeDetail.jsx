import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

/* ===== LABELY PRO UX ===== */
const fieldLabels = {
  nadpis: "Název zakázky",
  popis: "Popis",
  kategorie: "Kategorie",
  ukon: "Úkon",
  cenaPerHa: "Cena",
  ha: "Množství",
  cenaType: "Jednotka",
  stat: "Stát",
  kraj: "Kraj",
  mesto: "Město",
  parcelLink: "Odkaz na parcelu"
};

/* ===== DIFF KOMPONENTA ===== */
const ChangeDiff = ({ original, changes }) => {
  if (!original || !changes) return null;

  return (
    <div className="mt-6 bg-gray-50 border rounded-xl p-5 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Přehled změn
      </h3>

      {Object.keys(changes).map((key) => {
        const oldVal = original[key];
        const newVal = changes[key];
        if (oldVal === newVal) return null;

        const render = (val) =>
          typeof val === "string"
            ? val.replace(/<[^>]+>/g, "")
            : String(val ?? "—");

        return (
          <div key={key}>
            <p className="font-medium text-gray-700">
              {fieldLabels[key] || key}
            </p>

            <div className="grid md:grid-cols-2 gap-4 mt-1">
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-xs text-red-600 mb-1">Původní</p>
                <div className="text-red-800 whitespace-pre-wrap">
                  {render(oldVal)}
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-xs text-green-600 mb-1">Nové</p>
                <div className="text-green-800 whitespace-pre-wrap">
                  {render(newVal)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const InzeratChangeDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { backendUrl,userData } = useContext(AppContent);

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
          if (!userData) return; // počkej na načtení dat
          if (userData.role !== "admin") {
              toast.error("Nemáte oprávnění pro přístup k této stránce.");
              navigate(-1); // redirect zpět
          }
          }, [userData, navigate]);
  const fetchDetail = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/inzeratRequest/getInzeratChangeDetail/${requestId}`,
        { withCredentials: true }
      );
      console.log("Detail response data:", data);
      if (data.success) {
        setRequest(data);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při načítání detailu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, []);

  const approve = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzeratRequest/approveInzeratChange`,
        { requestId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Změna schválena");
        navigate("/inzeratChangesApproval");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Chyba při schválení");
    }
  };

  const reject = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzeratRequest/rejectInzeratChange`,
        { requestId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.info("Změna zamítnuta");
        navigate("/inzeratChangesApproval");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Chyba při zamítnutí");
    }
  };
   console.log("Request data:", request);
  if (loading) {
    return <div className="pt-28 text-center">Načítání…</div>;
  }

  if (!request) {
    return <div className="pt-28 text-center">Žádost nenalezena</div>;
  }

  const { inzerat, user, newData, requestMeta } = request;
  console.log("Request data:", request);
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16 max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Schválení změn inzerátu
        </h1>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {inzerat.nadpis}
          </h2>

          <div>
    <p className="text-sm text-gray-500">Autor inzerátu</p>
    <p className="font-medium text-gray-800">
      {user?.name || user?.email || "—"}
    </p>
  </div>
         <div>
    <p className="text-sm text-gray-500">Stav inzerátu</p>
    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold
      bg-yellow-100 text-yellow-800">
      {inzerat.stav}
    </span>
  </div>

  <div>
    <p className="text-sm text-gray-500">Kategorie / Úkon</p>
    <p className="text-gray-800">
      {inzerat.kategorie} – {inzerat.ukon}
    </p>
  </div>

  <div>
    <p className="text-sm text-gray-500">Lokalita</p>
    <p className="text-gray-800">
      {[inzerat.mesto, inzerat.kraj, inzerat.stat].filter(Boolean).join(", ")}
    </p>
  </div>

  <div>
    <p className="text-sm text-gray-500">Cena</p>
    <p className="text-gray-800">
      {inzerat.cenaPerHa} Kč / {inzerat.cenaType}
    </p>
  </div>

  <div>
    <p className="text-sm text-gray-500">Množství</p>
    <p className="text-gray-800">
      {inzerat.ha}
    </p>
  </div>
          <p className="text-xs text-gray-500 mb-4">
            Vytvořeno: {new Date(requestMeta.createdAt).toLocaleString("cs-CZ")}
          </p>

          {/* DIFF */}
          <ChangeDiff
            original={inzerat}
            changes={newData}
          />

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={reject}
              className="flex items-center gap-1 bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700"
            >
              <XMarkIcon className="w-5 h-5" />
              Zamítnout
            </button>

            <button
              onClick={approve}
              className="flex items-center gap-1 bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700"
            >
              <CheckIcon className="w-5 h-5" />
              Schválit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InzeratChangeDetail;
