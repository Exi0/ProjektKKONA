import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/czech-republic/czech-republic-regions.json";
const DashboardGeoEngagement = () => {
  const { backendUrl } = useContext(AppContent);
  const [engagement, setEngagement] = useState([]);
  const [kraje, setKraje] = useState([]);
  const [tooltip, setTooltip] = useState("");
  useEffect(() => {
    const fetch = async () => {
      try {
        const [e, k] = await Promise.all([
          axios.get(`${backendUrl}/api/stats/engagement-monthly`),
          axios.get(`${backendUrl}/api/stats/geo-kraje`)
        ]);
        if (e.data.success) setEngagement(e.data.data);
        if (k.data.success) setKraje(k.data.data);
      } catch (err) {
        console.error("❌ Chyba při načítání dat pro grafy:", err);
      }
    };
    fetch();
  }, [backendUrl]);

  const colorScale = scaleLinear()
    .domain([0, Math.max(...kraje.map(k => k.count), 10)])
    .range(["#dcfce7", "#16a34a"]);

  return (
    <div className="grid lg:grid-cols-1 gap-8 mt-12">
      
      {/* 1️⃣ Engagement Over Time */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center">
          📈 Vývoj engagementu (měsíčně)
        </h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={engagement}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Zobrazení" />
            <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Lajky" />
            <Line type="monotone" dataKey="interests" stroke="#22c55e" name="Zájmy" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardGeoEngagement;
