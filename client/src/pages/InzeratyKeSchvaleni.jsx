import React, { useContext, useEffect, useState } from "react";
import Navbar from "../components/navbar";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { CheckIcon, XMarkIcon,ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from 'react-router-dom';
const InzeratyKeSchvaleni = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
        if (!userData) return; // počkej na načtení dat
        if (userData.role !== "admin") {
            toast.error("Nemáte oprávnění pro přístup k této stránce.");
            navigate(-1); // redirect zpět
        }
        }, [userData, navigate]);
  // 🔥 načtení všech inzerátů čekajících na schválení
  const fetchPending = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/inzerat/getPendingInzerats`);
      if (data.success) {
        setPending(data.inzeratData);
      } else {
        setPending([]);
        toast.info(data.message || "Žádné čekající inzeráty");
      }
    } catch (error) {
      toast.error("Nepodařilo se načíst inzeráty ke schválení");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // ✅ schválení inzerátu → změna na "Veřejný"
  const handlePublish = async (id) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/inzerat/publishInzerat`, {
        inzeratId: id,
      });
      if (data.success) {
        toast.success("Inzerát byl schválen a publikován");
        setPending((prev) => prev.filter((item) => item._id !== id));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Chyba při schvalování inzerátu");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />

      <div className="container mx-auto px-4 pt-28 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <motion.h1
            className="text-3xl font-bold text-black text-center lg:text-left"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            Inzeráty ke schválení
          </motion.h1>

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
          <p className="text-center text-gray-600">Načítám…</p>
        ) : pending.length === 0 ? (
          <p className="text-center text-gray-600">Žádné inzeráty ke schválení.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pending.map((item, index) => (
              <motion.div
                key={item._id}
                className="bg-white shadow-lg rounded-2xl p-6 hover:shadow-2xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.45 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-800">{item.nadpis}</h2>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleDateString("cs-CZ")}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700 mb-3">
                  <p><span className="font-semibold">Autor:</span> {item.user?.name || "Neznámý"}</p>
                  <p><span className="font-semibold">Kategorie:</span> {item.kategorie || "—"}</p>
                  <p><span className="font-semibold">Úkon:</span> {item.ukon || "—"}</p>
                  <p>
                    <span className="font-semibold">Lokalita:</span>{" "}
                    {[item.mesto, item.kraj, item.stat].filter(Boolean).join(", ") || "—"}
                  </p>
                  <p><span className="font-semibold">Cena:</span>{" "}
                    {item.cenaPerHa
                      ? `${item.cenaPerHa.toLocaleString("cs-CZ")} Kč/${item.cenaType || "ha"}`
                      : "Neuvedeno"}
                  </p>
                </div>

                {item.popis && (
                  <div
                    className="prose max-w-none text-sm text-gray-700 mt-2 line-clamp-3 overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: item.popis }}
                  />
                )}

                <div className="flex justify-end mt-5 gap-3">
                  <button
                    onClick={() => handlePublish(item._id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow hover:bg-green-700 transition-all duration-200"
                  >
                    <CheckIcon className="w-5 h-5" />
                    Schválit
                  </button>
                  <button
                    onClick={() => toast.info("Zatím neděláme mazání, klídek")}
                    className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-full shadow hover:bg-gray-500 transition-all duration-200"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    Zamítnout
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InzeratyKeSchvaleni;