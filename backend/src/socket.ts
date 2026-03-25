import { Server } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import jwt from "jsonwebtoken";

let io: Server;
const onlineUsers = new Set<number>();

export function initSocketServer(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    let currentUserId: number | null = null;
    const cookieHeader = socket.request.headers.cookie;
    if (cookieHeader) {
      const tokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (tokenMatch) {
         try {
            const secret = process.env.JWT_SECRET || 'homesync-dev-secret-do-not-use-in-prod';
            const decoded = jwt.verify(tokenMatch[1], secret) as { userId: number };
            if (decoded.userId) {
              currentUserId = decoded.userId;
              socket.join(`user:${currentUserId}`);
              onlineUsers.add(currentUserId);
              io.emit("presence", { onlineUserIds: Array.from(onlineUsers) });
            }
         } catch(e) {
            console.error("Socket authentication failed:", e);
         }
      }
    }

    socket.on("disconnect", () => {
      if (currentUserId) {
        onlineUsers.delete(currentUserId);
        io.emit("presence", { onlineUserIds: Array.from(onlineUsers) });
      }
    });

    socket.on("join_room", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });
    
    socket.on("typing_start", ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing_start", { userId });
    });
    
    socket.on("typing_stop", ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit("typing_stop", { userId });
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}
