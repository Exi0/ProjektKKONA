import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const EngagementChart = () => {
  const { backendUrl } = useContext(AppContent);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/stats/engagement`);
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error("❌ Chyba při načítání engagement dat:", err);
      }
    };
    fetchData();
  }, [backendUrl]);

  if (!data.length)
    return <p className="text-gray-600 mt-6 text-center">Načítám data o aktivitě...</p>;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 mt-10">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
        🔥 Top 10 nejaktivnějších inzerátů (Engagement Score)
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="title"
            tick={{ fill: "#374151", fontSize: 12 }}
            interval={0}
            textAnchor="end"
          />
          <YAxis tick={{ fill: "#374151" }} />
          <Tooltip
            formatter={(value, name) => {
              const labels = {
                score: "Skóre",
                views: "Zobrazení",
                favorites: "Lajky",
                interests: "Zájmy",
              };
              return [value, labels[name] || name];
            }}
          />
          <Legend />
          <Bar dataKey="views" barSize={20} fill="#93c5fd" name="Zobrazení" />
          <Bar dataKey="favorites" barSize={20} fill="#fca5a5" name="Lajky" />
          <Bar dataKey="interests" barSize={20} fill="#86efac" name="Zájmy" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#16a34a"
            strokeWidth={3}
            name="Engagement skóre"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EngagementChart;
