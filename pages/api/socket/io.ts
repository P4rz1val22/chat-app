import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";

interface SocketServer extends NetServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  // Check if Socket.io server is already running
  if (res.socket.server.io) {
    console.log("✅ Socket.io server already running");
    res.end();
    return;
  }

  console.log("🚀 Starting Socket.io server...");

  // Create new Socket.io server with default path
  const io = new SocketIOServer(res.socket.server, {
    cors: {
      origin: "*", // In production, specify your domain
      methods: ["GET", "POST"],
    },
  });

  // Attach to the server
  res.socket.server.io = io;

  // Handle connections
  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Test event - echoes back any message
    socket.on("test_message", (data) => {
      console.log("📨 Received test message:", data);
      socket.emit("test_response", {
        message: `Echo: ${data.message}`,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log("✅ Socket.io server started successfully");
  res.end();
}
