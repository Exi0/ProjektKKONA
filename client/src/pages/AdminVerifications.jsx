import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
const AdminVerifications = () => {
  const { backendUrl, userData } = useContext(AppContent);
  const [pendingUsers, setPendingUsers] = useState([]);
  const navigate = useNavigate();

  // ✅ Redirect pokud není admin
  useEffect(() => {
    if (userData && userData.role !== "admin") {
      toast.error("Nemáte oprávnění pro vstup na tuto stránku");
      navigate(-1); // vrátí na poslední stránku
    }
  }, [userData, navigate]);

  const fetchPending = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/verification/pendingVerifications`,
        { withCredentials: true }
      );
      if (data.success) setPendingUsers(data.users);
    } catch {
      toast.error("Chyba při načítání verifikací");
    }
  };

  const handleAction = async (userId, action) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/verification/${action}/${userId}`,
        {},
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        fetchPending();
      }
    } catch {
      toast.error("Chyba při změně stavu verifikace");
    }
  };

  useEffect(() => {
    if (userData?.role === "admin") {
      fetchPending();
    }
  }, [userData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="flex flex-col items-center pt-24 pb-10">
        <div className="bg-white shadow-2xl rounded-lg w-full max-w-5xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-3xl font-bold text-green-800 text-center sm:text-left">
              ⏳ Čekající verifikace
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

          {pendingUsers.length === 0 ? (
            <p className="text-gray-600 text-center">
              Žádné žádosti k ověření.
            </p>
          ) : (
            <ul className="space-y-4">
              {pendingUsers.map((u) => (
                <li
                  key={u._id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-green-50 transition"
                >
                  <div className="flex items-start gap-3">
                    {u.avatarPath ? (
                      <img
                        src={`${backendUrl}/${u.avatarPath.replace(/\\/g, "/")}`}
                        alt={u.name}
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-700">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="text-sm text-gray-500">IČO: {u.ico}</p>
                      <p
                        className={`text-xs font-medium ${getStatusColor(
                          u.verification?.status
                        )}`}
                      >
                        Status: {u.verification?.status}
                      </p>
                      {u.verification?.documentPath && (
                        <a
                          href={`${backendUrl}/${u.verification.documentPath.replace(
                            /\\/g,
                            "/"
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                        >
                          📄 Zobrazit dokument
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => handleAction(u._id, "approveVerification")}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
                    >
                      Schválit
                    </button>
                    <button
                      onClick={() => handleAction(u._id, "rejectVerification")}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
                    >
                      Zamítnout
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVerifications;
