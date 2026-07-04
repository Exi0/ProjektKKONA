import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { connectSocket } from "../services/socketService";
import {
  ChatBubbleLeftRightIcon, ClockIcon
} from "@heroicons/react/24/solid";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

const Conversations = () => {
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/conversation/user`, { withCredentials: true });
      if (data.success) setConversations(data.conversations || []);
    } catch {}
    finally { setLoading(false); }
  };

  // Socket: live conversation updates
  useEffect(() => {
    if (!userData?.id) return;
    const socket = connectSocket(userData.id);

    const handleConvUpdate = ({ conversation }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversation._id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], lastMessage: conversation.lastMessage, lastUpdated: conversation.lastUpdated };
          return updated;
        }
        return [conversation, ...prev];
      });
    };

    // Listen on all conversation rooms
    conversations.forEach((c) => socket.emit("join-conversation", c._id));
    socket.on("conversation-updated", handleConvUpdate);

    return () => {
      conversations.forEach((c) => socket.emit("leave-conversation", c._id));
      socket.off("conversation-updated", handleConvUpdate);
    };
  }, [userData?.id, conversations.length]);

  useEffect(() => { loadConversations(); }, []);

  const formatTime = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "právě teď";
    if (diff < 3600000) return `před ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return date.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });
  };

  // Sort by last activity
  const sorted = [...conversations].sort((a, b) =>
    new Date(b.lastUpdated || b.updatedAt) - new Date(a.lastUpdated || a.updatedAt)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-600" /> Konverzace
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{sorted.length} konverzací</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <ChatBubbleLeftIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Žádné konverzace</p>
            <p className="text-sm text-gray-400 mt-1">Konverzace vznikne po projevení zájmu o zakázku.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((conv) => {
              const other = conv.participants?.find((p) => p._id !== userData?.id);
              return (
                <button
                  key={conv._id}
                  onClick={() => navigate(`/konverzace/${conv._id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all p-4 text-left"
                >
                  {/* Avatar */}
                  {other?.avatarPath ? (
                    <img src={`${backendUrl}/${other.avatarPath.replace(/\\/g, "/")}`}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold flex-shrink-0">
                      {other?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{other?.name || "Uživatel"}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatTime(conv.lastUpdated || conv.updatedAt)}
                      </span>
                    </div>
                    {conv.inzerat?.nadpis && (
                      <p className="text-xs text-green-600 truncate mt-0.5">{conv.inzerat.nadpis}</p>
                    )}
                    <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage || "Žádné zprávy"}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
