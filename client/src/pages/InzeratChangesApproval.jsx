import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { CheckIcon, XMarkIcon,ArrowLeftIcon } from "@heroicons/react/24/solid";

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

const ChangeDiff = ({ original, changes }) => {
  if (!changes || !original) return null;

  return (
    <div className="mt-4 border rounded-lg bg-gray-50 p-4 space-y-3">
      <h3 className="font-semibold text-gray-800 mb-2">
        Přehled změn
      </h3>

      {Object.keys(changes).map((key) => {
        const oldVal = original[key];
        const newVal = changes[key];

        if (oldVal === newVal) return null;

        return (
          <div key={key} className="text-sm">
            <p className="font-medium text-gray-700">
              {fieldLabels[key] || key}
            </p>

            <div className="grid md:grid-cols-2 gap-3 mt-1">
              {/* PŮVODNÍ */}
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-xs text-red-600 mb-1">Původní</p>
                <div className="text-red-800 whitespace-pre-wrap">
                  {typeof oldVal === "string"
                    ? oldVal.replace(/<[^>]+>/g, "")
                    : String(oldVal ?? "—")}
                </div>
              </div>

              {/* NOVÉ */}
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <p className="text-xs text-green-600 mb-1">Nové</p>
                <div className="text-green-800 whitespace-pre-wrap">
                  {typeof newVal === "string"
                    ? newVal.replace(/<[^>]+>/g, "")
                    : String(newVal ?? "—")}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const InzeratChangesApproval = () => {
  const { backendUrl,userData } = useContext(AppContent);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
    useEffect(() => {
        if (!userData) return; // počkej na načtení dat
        if (userData.role !== "admin") {
            toast.error("Nemáte oprávnění pro přístup k této stránce.");
            navigate(-1); // redirect zpět
        }
        }, [userData, navigate]);
  const fetchRequests = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/inzeratRequest/getPendingInzeratChanges`,
        { withCredentials: true }
      );
      console.log(data);
      if (data.success) {
        setRequests(data.requests);
      } else {
        toast.error(data.message || "Nepodařilo se načíst žádosti");
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při načítání žádostí");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approve = async (requestId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzeratRequest/approveInzeratChange`,
        { requestId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Změna byla schválena");
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při schválení");
    }
  };

  const reject = async (requestId) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/inzeratRequest/rejectInzeratChange`,
        { requestId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.info("Změna byla zamítnuta");
        fetchRequests();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Chyba při zamítnutí");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Inzeráty čekající na schválení
          </h1>

          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2
                      bg-gray-600 text-white px-4 py-2 rounded-lg
                      hover:bg-gray-700 transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Zpět do admin menu
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">Načítání…</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-600">Žádné změny ke schválení 🎉</p>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
  key={req._id}
  className="bg-white rounded-xl shadow p-5"
>
  <div className="flex justify-between items-start">
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        {req.inzerat?.nadpis || "—"}
      </h2>
      <p className="text-sm text-gray-600">
        Autor změny:{" "}
        <span className="font-medium">
          {req.user?.name || req.user?.email}
        </span>
      </p>
      <p className="text-xs text-gray-500">
        {new Date(req.createdAt).toLocaleString("cs-CZ")}
      </p>
    </div>

    <div className="flex gap-3 items-center">
    {/* 🔗 OTEVŘÍT INZERÁT */}
    <button
        onClick={() => navigate(`/inzeratChangeDetail/${req._id}`)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        title="Otevřít detail inzerátu"
    >
        Otevřít inzerát
    </button>

    {/* ✅ SCHVÁLIT */}
    <button
        onClick={() => approve(req._id)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
        Schválit
    </button>

    {/* ❌ ZAMÍTNOUT */}
    <button
        onClick={() => reject(req._id)}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
    >
        Zamítnout
    </button>
    </div>
  </div>

  {/* 👇 TADY JE DIFF */}
  <ChangeDiff
    original={req.inzerat}
    changes={req.newData}
  />
</div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InzeratChangesApproval;
