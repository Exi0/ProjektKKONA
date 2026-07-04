import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MonthlyUsersChart = () => {
  const { backendUrl } = useContext(AppContent);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/stats/monthly-users`);
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("❌ Chyba při načítání dat uživatelů:", err);
      }
    };
    fetchData();
  }, [backendUrl]);

  if (!data.length) return <p className="text-gray-600 mt-6 text-center">Načítám data...</p>;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mt-10">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        👥 Počet nově registrovaných uživatelů za posledních 12 měsíců
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fill: "#374151" }} />
          <YAxis tick={{ fill: "#374151" }} />
          <Tooltip
            formatter={(value) => [`${value} uživatelů`, "Registrace"]}
            labelFormatter={(label) => `Měsíc: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#1e3a8a"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2 }}
            name="Noví uživatelé"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyUsersChart;
