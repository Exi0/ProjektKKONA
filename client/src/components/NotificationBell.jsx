import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";

// Ikony podle typu notifikace
const typeIcons = {
  new_interest: "📢",
  interest_removed: "ℹ️",
  winner_selected: "🎉",
  new_message: "💬",
  inzerat_approved: "✅",
  inzerat_rejected: "❌",
  image_approved: "🖼️",
  image_rejected: "🚫",
  profile_verified: "🛡️",
  system: "⚙️",
};

const NotificationBell = () => {
  const { backendUrl } = useContext(AppContent);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // ── Poll unread count every 30s ──────────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/notifications/unread-count`,
          { withCredentials: true }
        );
        if (data.success) setUnreadCount(data.unreadCount);
      } catch {
        // tiché selhání — nesmí blokovat UI
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [backendUrl]);

  // ── Fetch notifications when dropdown opens ──────────────────────
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/notifications?limit=15`,
          { withCredentials: true }
        );
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // tiché selhání
      } finally {
        setLoading(false);
      }
    })();
  }, [open, backendUrl]);

  // ── Close on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Mark single as read + navigate ───────────────────────────────
  const handleClick = async (notif) => {
    if (!notif.read) {
      try {
        await axios.patch(
          `${backendUrl}/api/notifications/${notif._id}/read`,
          {},
          { withCredentials: true }
        );
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // tiché selhání
      }
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  // ── Mark all as read ─────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await axios.patch(
        `${backendUrl}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // tiché selhání
    }
  };

  // ── Time ago helper ──────────────────────────────────────────────
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "právě teď";
    if (mins < 60) return `před ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `před ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `před ${days} dny`;
    return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(
      new Date(dateStr)
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell button ───────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-green-800 transition-colors"
        aria-label="Notifikace"
      >
        {/* SVG zvoneček */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ──────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Notifikace</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-700 hover:text-green-900 font-medium"
              >
                Označit vše jako přečtené
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-gray-400 py-8 text-sm animate-pulse">
                Načítám…
              </p>
            ) : notifications.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                Žádné notifikace
              </p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    notif.read ? "opacity-60" : "bg-green-50/40"
                  }`}
                >
                  {/* Ikona */}
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {typeIcons[notif.type] || "🔔"}
                  </span>

                  {/* Obsah */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.read ? "text-gray-600" : "text-gray-900 font-medium"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.read && (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
