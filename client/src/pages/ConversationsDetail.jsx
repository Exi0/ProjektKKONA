import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import { AppContent } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { getSocket, connectSocket } from "../services/socketService";
import {
  PaperAirplaneIcon, ArrowLeftIcon, CheckIcon, CheckCircleIcon
} from "@heroicons/react/24/solid";

const ConversationDetail = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContent);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(null); // userId kdo píše
  const [convInfo, setConvInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // ── Load messages (initial) ──
  const loadMessages = async () => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/message/list?conversationId=${conversationId}`,
        { withCredentials: true }
      );
      if (data.success) setMessages(data.messages);
    } catch { toast.error("Chyba při načítání zpráv"); }
  };

  // ── Load conversation info ──
  const loadConvInfo = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/conversation/user`, { withCredentials: true });
      if (data.success) {
        const conv = data.conversations.find((c) => c._id === conversationId);
        if (conv) setConvInfo(conv);
      }
    } catch {}
  };

  // ── Mark as read ──
  const markRead = useCallback(async () => {
    try {
      await axios.post(`${backendUrl}/api/message/read`, { conversationId }, { withCredentials: true });
    } catch {}
  }, [backendUrl, conversationId]);

  // ── Socket setup ──
  useEffect(() => {
    if (!userData?.id) return;

    const socket = connectSocket(userData.id);
    socket.emit("join-conversation", conversationId);

    // Listen for new messages
    const handleNewMessage = ({ message, conversationId: convId }) => {
      if (convId === conversationId) {
        setMessages((prev) => {
          // Dedupe check
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Auto mark read if we're viewing this conversation
        markRead();
      }
    };

    // Typing indicator
    const handleTyping = ({ userId, isTyping, conversationId: convId }) => {
      if (convId === conversationId && userId !== userData.id) {
        setTyping(isTyping ? userId : null);
      }
    };

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleTyping);

    return () => {
      socket.emit("leave-conversation", conversationId);
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleTyping);
    };
  }, [conversationId, userData?.id, markRead]);

  // Initial load + mark read
  useEffect(() => {
    loadMessages();
    loadConvInfo();
    markRead();
  }, [conversationId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Send message ──
  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/message/send`,
        { conversationId, text },
        { withCredentials: true }
      );
      if (data.success) {
        // Message will arrive via socket, but add optimistically
        setMessages((prev) => {
          if (prev.some((m) => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
        setText("");
        // Stop typing
        const socket = getSocket();
        socket.emit("typing", { conversationId, userId: userData.id, isTyping: false });
      }
    } catch { toast.error("Chyba při odesílání"); }
    finally { setSending(false); }
  };

  // ── Typing emit ──
  const handleTypingEmit = () => {
    const socket = getSocket();
    socket.emit("typing", { conversationId, userId: userData.id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { conversationId, userId: userData.id, isTyping: false });
    }, 2000);
  };

  // Enter to send
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Other user info
  const otherUser = convInfo?.participants?.find((p) => p._id !== userData?.id);

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" });

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-200 to-amber-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto pt-20 pb-4 px-4">

        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 border-b-0 px-5 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          {otherUser ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {otherUser.avatarPath ? (
                <img src={`${backendUrl}/${otherUser.avatarPath.replace(/\\/g, "/")}`}
                  alt="" className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                  {otherUser.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{otherUser.name}</p>
                {convInfo?.inzerat?.nadpis && (
                  <p className="text-xs text-gray-400 truncate">{convInfo.inzerat.nadpis}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="font-semibold text-gray-800 text-sm">Konverzace</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white border-x border-gray-100 px-5 py-4 overflow-y-auto space-y-1"
          style={{ minHeight: "300px", maxHeight: "calc(100vh - 220px)" }}>

          {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <div className="flex justify-center my-4">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {formatDate(msgs[0].createdAt)}
                </span>
              </div>
              {msgs.map((m, i) => {
                const isMe = (m.sender?._id || m.sender) === userData?.id;
                const showAvatar = !isMe && (i === 0 || (msgs[i - 1]?.sender?._id || msgs[i - 1]?.sender) !== (m.sender?._id || m.sender));
                return (
                  <div key={m._id} className={`flex mb-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="w-7 flex-shrink-0">
                        {showAvatar && m.sender?.avatarPath ? (
                          <img src={`${backendUrl}/${m.sender.avatarPath.replace(/\\/g, "/")}`}
                            className="w-7 h-7 rounded-lg object-cover" />
                        ) : showAvatar ? (
                          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                            {m.sender?.name?.charAt(0) || "?"}
                          </div>
                        ) : null}
                      </div>
                    )}
                    <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-green-600 text-white rounded-br-md ml-2"
                        : "bg-gray-100 text-gray-800 rounded-bl-md ml-1.5"
                    }`}>
                      {m.text}
                      <span className={`block text-[10px] mt-0.5 ${isMe ? "text-green-200" : "text-gray-400"}`}>
                        {formatTime(m.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-xs text-gray-400">píše…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 border-t-0 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); handleTypingEmit(); }}
              onKeyDown={handleKeyDown}
              placeholder="Napište zprávu…"
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-green-500 focus:outline-none max-h-32"
              style={{ minHeight: "42px" }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="bg-green-600 text-white p-2.5 rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
