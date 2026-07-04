import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";

const TopUsers = () => {
  const { backendUrl } = useContext(AppContent);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${backendUrl}/api/user/top`)
      .then(res => {
        if (res.data.success) setUsers(res.data.users);
      })
      .catch(() => console.error("Chyba při načítání top uživatelů"));
  }, [backendUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="pt-28 pb-10 max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🏆 Top uživatelé</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((u, idx) => (
            <div
              key={u._id}
              onClick={() => navigate(`/profil/${u._id}`)}
              className="bg-white rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition"
            >
              <div className="flex items-center gap-4">
                <img
                  src={u.avatarPath ? `${backendUrl}/${u.avatarPath}` : "/default-avatar.png"}
                  alt={u.name}
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <div>
                  <h2 className="text-xl font-semibold">{idx + 1}. {u.name}</h2>
                  <p className="text-gray-500 text-sm">{u.location || "Neuvedeno"}</p>
                  <p className="text-yellow-600 font-bold">{u.favoritesCount} oblíbení</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopUsers;
