import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  UserIcon,
  PhoneIcon,
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";

const Header = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/stats/overview`);
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error("❌ Chyba při načítání statistik:", err);
      }
    };
    fetchStats();
  }, [backendUrl]);

  const cards = stats
    ? [
        {
          label: "Registrovaní uživatelé",
          value: stats.users,
          icon: <UsersIcon className="w-6 h-6 text-green-700" />,
        },
        {
          label: "Počet inzerátů",
          value: stats.inzeraty,
          icon: <ChartBarIcon className="w-6 h-6 text-amber-700" />,
        },
        {
          label: "Celkem zobrazení",
          value: stats.totalViews,
          icon: <EyeIcon className="w-6 h-6 text-blue-700" />,
        },
      ]
    : [];

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] text-white px-5 overflow-hidden">
      {/* žádné pozadí, sekce transparentní */}
      <div className="relative z-10 container mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20 py-10">
        {/* Levá část - text + formulář */}
        <div className="flex-1 max-w-xl text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight text-gray-900 drop-shadow">
            Registrace do největšího{" "}
            <span className="text-green-700">zemědělského portálu</span>
          </h1>
          <h2 className="text-lg text-amber-700 mb-6 font-medium drop-shadow">
            s ověřenými poptávkami
          </h2>

          <div className="bg-white/90 backdrop-blur-md text-gray-800 p-6 rounded-2xl shadow-xl border border-green-200/40">
            {/* Form */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full w-full">
                <UserIcon className="w-5 h-5 text-green-700" />
                <input
                  type="text"
                  placeholder="Jméno / IČ"
                  className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-500"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full w-full">
                <PhoneIcon className="w-5 h-5 text-green-700" />
                <input
                  type="tel"
                  placeholder="Telefon"
                  className="bg-transparent w-full outline-none text-gray-700 placeholder-gray-500"
                />
              </div>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="w-full py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-all"
            >
              Odebírat poptávky zdarma
            </button>

            {/* ✅ Statistiky z backendu */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 text-sm text-gray-700">
              {cards.map((card, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-200/40"
                >
                  {card.icon}
                  <p className="font-bold text-gray-900">{card.value ?? "-"}</p>
                  <span className="text-xs text-gray-600 text-center">
                    {card.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pravá část - citát */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="bg-white/60 backdrop-blur-md border border-green-300/40 rounded-2xl p-6 max-w-sm shadow-xl text-gray-800">
            <p className="italic text-lg mb-6 leading-relaxed text-gray-700">
              „Na AgroZakázkach jsem získal spoustu zakázek a výborná hodnocení.“
            </p>
            <div className="flex items-center gap-3">
              <img
                src="https://randomuser.me/api/portraits/men/7.jpg"
                alt="Uživatel"
                className="w-12 h-12 rounded-full border-2 border-green-400"
              />
              <div>
                <p className="font-semibold text-green-800">Petr Novák</p>
                <p className="text-sm text-gray-600">
                  Majitel farmy v Olomouci
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Header;
