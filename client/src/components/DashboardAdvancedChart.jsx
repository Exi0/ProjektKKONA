import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ComposedChart
} from "recharts";

const COLORS = ["#16a34a", "#15803d", "#84cc16", "#a16207", "#7e22ce", "#0ea5e9", "#ef4444"];

const DashboardAdvancedChart = () => {
  const { backendUrl } = useContext(AppContent);
  const [userActivity, setUserActivity] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [avgPrice, setAvgPrice] = useState([]);
  const [topUsers, setTopUsers] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [act, week, avg, top] = await Promise.all([
          axios.get(`${backendUrl}/api/stats/user-activity`),
          axios.get(`${backendUrl}/api/stats/weekly-activity`),
          axios.get(`${backendUrl}/api/stats/avg-price`),
          axios.get(`${backendUrl}/api/stats/top-rated-users`)
        ]);
        console.log(top.data.data)
        if (act.data.success) setUserActivity(act.data.data);
        if (week.data.success) setWeeklyActivity(week.data.data);
        if (avg.data.success) setAvgPrice(avg.data.data);
        if (top.data.success) setTopUsers(top.data.data);
      } catch (err) {
        console.error("❌ Chyba při načítání pokročilých grafů:", err);
      }
    };
    fetch();
  }, [backendUrl]);

  return (
    <div className="grid xl:grid-cols-1 gap-8 mt-10">
      {/* 1️⃣ Aktivita uživatelů */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">👥 Aktivita uživatelů (Top 10)</h2>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={userActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="inzeraty" fill="#16a34a" name="Inzeráty" />
            <Bar dataKey="zajmy" fill="#0ea5e9" name="Zájmy" />
            <Line dataKey="total" stroke="#15803d" name="Celkem" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2️⃣ Aktivita za poslední týden */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">📅 Aktivita za posledních 7 dní</h2>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={weeklyActivity}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="users" name="Registrace" fill="#0ea5e9" stroke="#0284c7" />
            <Area type="monotone" dataKey="inzeraty" name="Inzeráty" fill="#16a34a" stroke="#15803d" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4️⃣ Průměrná cena podle jednotky */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">💸 Průměrná cena podle jednotky</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={avgPrice}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgPrice" fill="#84cc16" name="Průměrná cena" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 6️⃣ Top hodnocení uživatelé */}
<div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
  <h2 className="text-xl font-bold mb-4 text-center">⭐ Nejlépe hodnocení uživatelé</h2>
  <ResponsiveContainer width="100%" height={350}>
    <BarChart layout="vertical" data={topUsers}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" domain={[0, 5]} />
      <YAxis dataKey="name" type="category" width={150} />
      <Tooltip
        cursor={{ fill: "rgba(0,0,0,0.05)" }}
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const u = payload[0].payload;
            return (
              <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
                <p className="font-bold text-gray-800 mb-1">{u.name}</p>
                <p className="text-gray-700">
                  <span className="font-semibold">Celkové skóre:</span> {u.overall}★
                </p>
                <p className="text-green-700">
                  Spolehlivost: {u.avgReliability}★
                </p>
                <p className="text-blue-700">
                  Komunikace: {u.avgCommunication}★
                </p>
                <p className="text-amber-700">
                  Kvalita služby: {u.avgQuality}★
                </p>
                <p className="text-gray-500 italic mt-1">
                  ({u.totalRatings} hodnocení)
                </p>
              </div>
            );
          }
          return null;
        }}
      />
      <Bar dataKey="overall" fill="#facc15" name="Celkové skóre" radius={[0, 8, 8, 0]} />
    </BarChart>
  </ResponsiveContainer>
</div>

    </div>
  );
};

export default DashboardAdvancedChart;
