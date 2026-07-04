// config/socket.js
import { Server } from "socket.io";

let io = null;

export const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });

  // userId → Set<socketId> (víc tabů)
  const userSockets = new Map();

  io.on("connection", (socket) => {
    // Registrace uživatele
    socket.on("register", (userId) => {
      if (!userId) return;
      socket.userId = userId;
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
    });

    // Join/leave conversation room
    socket.on("join-conversation", (convId) => socket.join(`conv:${convId}`));
    socket.on("leave-conversation", (convId) => socket.leave(`conv:${convId}`));

    // Typing indicator
    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit("user-typing", { conversationId, userId, isTyping });
    });

    // Mark read (live)
    socket.on("mark-read", ({ conversationId, userId }) => {
      socket.to(`conv:${conversationId}`).emit("messages-read", { conversationId, userId });
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id);
        if (userSockets.get(socket.userId).size === 0) userSockets.delete(socket.userId);
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
