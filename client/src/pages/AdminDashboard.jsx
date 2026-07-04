import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { UsersIcon,ChartBarIcon ,EyeIcon, HeartIcon, HandRaisedIcon,ArrowLeftIcon } from "@heroicons/react/24/solid";
import MonthlyInzeratyChart from "../components/MonthlyInzeratyChart";
import MonthlyUsersChart from "../components/MonthlyUsersChart";
import DashboardCharts from "../components/DashboardChart";
import EngagementChart from "../components/EngagementChart";
import DashboardAdvancedChart from "../components/DashboardAdvancedChart";
import DashboardGeoEngagement from "../components/DashboardGeoEngagement";
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
      if (!userData) return; // počkej na načtení dat
      if (userData.role !== "admin") {
          toast.error("Nemáte oprávnění pro přístup k této stránce.");
          navigate(-1); // redirect zpět
      }
      }, [userData, navigate]);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/stats/overview`);
        if (data.success) setStats(data.stats);
      } catch (err) {
        console.error("❌ Chyba při načítání statistik:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [backendUrl]);
  
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <p className="text-lg text-gray-700">Načítám přehled...</p>
      </div>
    );

  if (!stats)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
        <p className="text-lg text-gray-700">Žádná data k zobrazení.</p>
      </div>
    );

  const cards = [
    { label: "Registrovaní uživatelé", value: stats.users, icon: <UsersIcon className="w-8 h-8 text-green-700" /> },
    { label: "Počet inzerátů", value: stats.inzeraty, icon: <ChartBarIcon className="w-8 h-8 text-amber-700" /> },
    { label: "Celkem zobrazení", value: stats.totalViews, icon: <EyeIcon className="w-8 h-8 text-blue-700" /> },
    { label: "Celkem lajků", value: stats.totalLikes, icon: <HeartIcon className="w-8 h-8 text-red-600" /> },
    { label: "Celkem zájmů", value: stats.totalInterests, icon: <HandRaisedIcon className="w-8 h-8 text-green-900" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="pt-28 pb-10 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">📊 Celkový přehled AgroPortal</h1>
        

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
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 transition-transform"
            >
              {card.icon}
              <p className="text-3xl font-extrabold text-green-800 mt-2">{card.value}</p>
              <p className="text-gray-700 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>
            <div className="mt-12 space-y-12">
                <MonthlyInzeratyChart />
                <MonthlyUsersChart />
                <DashboardCharts />
                <EngagementChart />
                <DashboardAdvancedChart />
                <DashboardGeoEngagement/>
            </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
