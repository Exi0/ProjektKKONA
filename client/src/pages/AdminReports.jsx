import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
const AdminReports = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();
    // ✅ ochrana pro adminy
    useEffect(() => {
    if (!userData) return; // počkej na načtení dat
    if (userData.role !== "admin") {
        toast.error("Nemáte oprávnění pro přístup k této stránce.");
        navigate(-1); // redirect zpět
    }
    }, [userData, navigate]);

  const fetchReports = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/reports/all`, {
        withCredentials: true,
      });
      if (data.success) setReports(data.reports);
    } catch {
      toast.error("Chyba při načítání reportů");
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/reports/delete/${id}`,
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        fetchReports();
      }
    } catch {
      toast.error("Chyba při mazání reportu");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="flex flex-col items-center pt-20 pb-10">
        <div className="bg-white shadow-2xl rounded-lg w-full max-w-5xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-green-800">
              🚨 Nahlášení uživatelé
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

          {reports.length === 0 ? (
            <p className="text-gray-600">Žádná nahlášení.</p>
          ) : (
            <ul className="space-y-4">
              {reports.map((r) => (
                <li
                  key={r._id}
                  className="border rounded-lg p-4 flex justify-between items-start bg-white shadow hover:bg-green-50 transition"
                >
                  {/* Info o reportu */}
                  <div className="flex items-start gap-3">
                    {r.reportedUser?.avatarPath ? (
                      <img
                        src={`${backendUrl}/${r.reportedUser.avatarPath.replace(
                          /\\/g,
                          "/"
                        )}`}
                        alt={r.reportedUser.name}
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                        {r.reportedUser?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-800">
                        {r.reportedUser?.name || "Neznámý uživatel"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {r.reportedUser?.email || "—"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Nahlásil:</span>{" "}
                        {r.fromUser?.name || "Anonym"} ({r.fromUser?.email})
                      </p>
                      <p className="text-gray-800 mt-2 italic">„{r.reason}“</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.createdAt).toLocaleString("cs-CZ")}
                      </p>
                    </div>
                  </div>

                  {/* Akce admina */}
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <FaTrash />
                    Smazat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
