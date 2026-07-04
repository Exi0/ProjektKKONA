import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ["#22c55e", "#e9d18fff", "#84cc16", "#a16207", "#92400e", "#0d9488", "#7e22ce"];

const DashboardChart = () => {
  const { backendUrl } = useContext(AppContent);
  const [categories, setCategories] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [byKraj, setByKraj] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [catRes, actRes, krajRes] = await Promise.all([
          axios.get(`${backendUrl}/api/stats/categories`),
          axios.get(`${backendUrl}/api/stats/active-users`),
          axios.get(`${backendUrl}/api/stats/by-kraj`),
        ]);
        if (catRes.data.success) setCategories(catRes.data.data);
        if (actRes.data.success) setActiveUsers(actRes.data.data);
        if (krajRes.data.success) setByKraj(krajRes.data.data);
      } catch (err) {
        console.error("❌ Chyba při načítání grafů:", err);
      }
    };
    fetchAll();
  }, [backendUrl]);

  return (
    <div className="grid lg:grid-cols-2 gap-8 mt-12">
      {/* 1️⃣ Kategorie */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          🧩 Rozložení inzerátů podle kategorií
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={categories}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {categories.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 5️⃣ Aktivní vs. neaktivní */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          👥 Poměr aktivních vs. neaktivních uživatelů
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={activeUsers}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {activeUsers.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 6️⃣ Inzeráty podle krajů */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
          🗺️ Počet inzerátů podle krajů
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={byKraj}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="kraj" tick={{ fill: "#374151", fontSize: 12 }} />
            <YAxis tick={{ fill: "#374151" }} />
            <Tooltip />
            <Bar dataKey="count" fill="#16a34a" name="Počet inzerátů" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardChart;
