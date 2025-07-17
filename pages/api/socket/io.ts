// pages/api/socket/io.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";
import { createPool } from "@/lib/db";
import type {
  SendMessageData,
  JoinRoomData,
  SwitchRoomData,
  TypingData,
  ChatMessageData,
  MessageHistoryData,
  TypingEventData,
  ErrorData,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types";

// Database return types
interface DbRoom {
  id: number;
  name: string;
  type: string;
  created_by: number;
  is_private: boolean;
  created_at: Date;
}

interface DbUser {
  id: number;
  name: string;
  email?: string;
  username: string;
}

interface DbMessage {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  sent_at: Date;
}

interface DbMessageWithUser {
  id: number;
  content: string;
  sent_at: Date;
  username: string;
  user_id: number;
}

interface SavedMessage {
  id: number;
  sent_at: Date;
}

// Socket.io server interfaces
interface SocketServer extends NetServer {
  io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined;
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
  if (res.socket.server.io) {
    console.log("✅ Socket.io server already running");
    res.end();
    return;
  }

  console.log("🚀 Starting Socket.io server...");

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    res.socket.server,
    {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    }
  );

  res.socket.server.io = io;

  // Typed helper functions
  async function getRoomId(roomName: string): Promise<number> {
    const pool = createPool();
    try {
      const roomQuery = "SELECT id FROM rooms WHERE name = $1";
      const roomResult = await pool.query(roomQuery, [roomName]);

      if (roomResult.rows.length > 0) {
        const room = roomResult.rows[0] as Pick<DbRoom, "id">;
        return room.id;
      }

      const createRoomQuery = `
        INSERT INTO rooms (name, type, created_by, is_private) 
        VALUES ($1, 'public_channel', 1, false) 
        RETURNING id
      `;
      const createResult = await pool.query(createRoomQuery, [roomName]);
      const newRoom = createResult.rows[0] as Pick<DbRoom, "id">;

      console.log(`📝 Created new room: ${roomName} with ID: ${newRoom.id}`);
      return newRoom.id;
    } catch (error) {
      console.error("❌ Error getting/creating room:", error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  async function getUserId(username: string, email?: string): Promise<number> {
    const pool = createPool();
    try {
      const userQuery = "SELECT id FROM users WHERE name = $1";
      const userResult = await pool.query(userQuery, [username]);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as Pick<DbUser, "id">;
        return user.id;
      }

      const createUserQuery = `
        INSERT INTO users (name, email, username) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `;
      const createResult = await pool.query(createUserQuery, [
        username,
        email || null,
        username.toLowerCase().replace(/\s+/g, ""),
      ]);
      const newUser = createResult.rows[0] as Pick<DbUser, "id">;

      console.log(`👤 Created new user: ${username} with ID: ${newUser.id}`);
      return newUser.id;
    } catch (error) {
      console.error("❌ Error getting/creating user:", error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  async function saveMessage(
    roomId: number,
    userId: number,
    content: string
  ): Promise<SavedMessage> {
    const pool = createPool();
    try {
      const query = `
        INSERT INTO messages (room_id, user_id, content, sent_at) 
        VALUES ($1, $2, $3, NOW()) 
        RETURNING id, sent_at
      `;
      const result = await pool.query(query, [roomId, userId, content]);
      return result.rows[0] as SavedMessage;
    } catch (error) {
      console.error("❌ Error saving message:", error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  async function loadRecentMessages(
    roomId: number,
    limit: number = 50
  ): Promise<DbMessageWithUser[]> {
    const pool = createPool();
    try {
      const query = `
        SELECT 
          m.id,
          m.content,
          m.sent_at,
          u.name as username,
          u.id as user_id
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.sent_at DESC
        LIMIT $2
      `;
      const result = await pool.query(query, [roomId, limit]);
      return result.rows.reverse() as DbMessageWithUser[];
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      throw error;
    } finally {
      await pool.end();
    }
  }

  // Track typing users per room
  const typingUsers = new Map<string, Set<string>>();

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.join("general");
    console.log(`👤 Socket ${socket.id} joined room: general`);

    socket.on("switch_room", async (data: SwitchRoomData) => {
      const { oldRoom, newRoom, username } = data;

      console.log(`🔄 ${username} switching from ${oldRoom} to ${newRoom}`);

      if (typingUsers.has(oldRoom)) {
        typingUsers.get(oldRoom)!.delete(username);
        if (typingUsers.get(oldRoom)!.size === 0) {
          typingUsers.delete(oldRoom);
        }

        const typingStopData: TypingEventData = {
          room: oldRoom,
          username,
          userId: data.userId || "unknown",
        };
        socket.to(oldRoom).emit("user_stopped_typing", typingStopData);
      }

      socket.leave(oldRoom);
      console.log(`👋 Socket ${socket.id} left room: ${oldRoom}`);

      socket.join(newRoom);
      console.log(`🚪 Socket ${socket.id} joined room: ${newRoom}`);

      try {
        const roomId = await getRoomId(newRoom);
        const recentMessages = await loadRecentMessages(roomId);

        const historyData: MessageHistoryData = {
          room: newRoom,
          messages: recentMessages.map((msg) => ({
            id: msg.id,
            message: msg.content,
            username: msg.username,
            userId: msg.user_id,
            timestamp: new Date(msg.sent_at).toISOString(),
            room: newRoom,
          })),
        };

        socket.emit("message_history", historyData);
        console.log(
          `📚 Loaded ${recentMessages.length} messages for room: ${newRoom}`
        );
      } catch (error) {
        console.error("❌ Error loading message history:", error);
        const errorData: ErrorData = {
          message: "Failed to load message history",
        };
        socket.emit("error", errorData);
      }
    });

    socket.on("send_chat_message", async (data: SendMessageData) => {
      const { message, username, userId, room, tempId } = data;

      console.log(`📨 Message from ${username} in room ${room}: ${message}`);

      try {
        const roomId = await getRoomId(room);
        const dbUserId = await getUserId(username);
        const savedMessage = await saveMessage(roomId, dbUserId, message);

        const messageData: ChatMessageData = {
          id: savedMessage.id,
          message,
          username,
          userId: dbUserId,
          room,
          timestamp: new Date(savedMessage.sent_at).toISOString(),
          socketId: socket.id,
          tempId,
        };

        io.to(room).emit("chat_message", messageData);
        console.log(`📡 Message saved to DB and broadcasted to room: ${room}`);
      } catch (error) {
        console.error("❌ Error processing message:", error);
        const errorData: ErrorData = {
          message: "Failed to send message",
        };
        socket.emit("error", errorData);
      }
    });

    socket.on("join_room", async (data: JoinRoomData) => {
      const { room, username } = data;

      try {
        const roomId = await getRoomId(room);
        const recentMessages = await loadRecentMessages(roomId);

        const historyData: MessageHistoryData = {
          room,
          messages: recentMessages.map((msg) => ({
            id: msg.id,
            message: msg.content,
            username: msg.username,
            userId: msg.user_id,
            timestamp: new Date(msg.sent_at).toISOString(),
            room,
          })),
        };

        socket.emit("message_history", historyData);
        console.log(
          `📚 Loaded ${recentMessages.length} messages for initial join to room: ${room}`
        );
      } catch (error) {
        console.error("❌ Error loading initial message history:", error);
        const errorData: ErrorData = {
          message: "Failed to load message history",
        };
        socket.emit("error", errorData);
      }
    });

    socket.on("user_typing_start", (data: TypingData) => {
      const { room, username, userId } = data;

      console.log(`📝 ${username} started typing in room: ${room}`);

      if (!typingUsers.has(room)) {
        typingUsers.set(room, new Set());
      }
      typingUsers.get(room)!.add(username);

      const typingEventData: TypingEventData = {
        room,
        username,
        userId,
      };

      socket.to(room).emit("user_typing", typingEventData);
      console.log(`📡 Broadcasted typing event for ${username}`);
    });

    socket.on("user_typing_stop", (data: TypingData) => {
      const { room, username, userId } = data;

      console.log(`🛑 ${username} stopped typing in room: ${room}`);

      if (typingUsers.has(room)) {
        typingUsers.get(room)!.delete(username);

        if (typingUsers.get(room)!.size === 0) {
          typingUsers.delete(room);
        }
      }

      const typingEventData: TypingEventData = {
        room,
        username,
        userId,
      };

      socket.to(room).emit("user_stopped_typing", typingEventData);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // Clean up typing users when user disconnects
      typingUsers.forEach((users, room) => {
        // In production, you'd want to track socket.id -> username mapping
        // for proper cleanup
      });
    });

    // Debug: Log all incoming events
    socket.onAny((eventName, ...args) => {
      console.log(`🔍 Event: ${eventName}`, args);
    });
  });

  console.log("✅ Socket.io server started successfully");
  res.end();
}
