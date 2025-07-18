// pages/api/socket/io.ts - COMPLETE FIXED VERSION
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { createPool, query, withTransaction } from "@/lib/db";
import type {
  SendMessageData,
  SwitchRoomData,
  TypingData,
  ChatMessageData,
  MessageHistoryData,
  JoinRoomData,
  ClientToServerEvents,
  ServerToClientEvents,
  Room,
  CreateRoomData,
  RoomCreatedData,
  AddMemberData,
  MemberAddedData,
  GetRoomsData,
  UserRoomsUpdatedData,
  NextApiResponseWithSocket,
  DbMessageWithUser,
  DbRoom,
  DbRoomWithMemberCount,
  DbUser,
} from "@/types";

// Track typing users and socket-to-user mapping
const typingUsers = new Map<string, Set<string>>();
const socketToUser = new Map<string, { username: string; room: string }>();

// =============================================================================
// MAIN HANDLER
// =============================================================================

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

  // =============================================================================
  // DATABASE FUNCTIONS - FIXED
  // =============================================================================

  async function ensureUserHasRoom(userId: number): Promise<void> {
    try {
      // Check if user has any rooms
      const roomCount = await query(
        `SELECT COUNT(*) as count FROM room_members WHERE user_id = $1`,
        [userId]
      );

      const count = parseInt(roomCount.rows[0].count);

      if (count === 0) {
        console.log(`📝 Creating default room for user ${userId}`);

        // Create a default "General" room for the user
        const defaultRoom = await createRoom(
          "General",
          "public_channel",
          userId,
          false // Make it public
        );

        console.log(
          `✅ Created default room "${defaultRoom.name}" for user ${userId}`
        );
      }
    } catch (error) {
      console.error("❌ Error ensuring user has room:", error);
    }
  }

  /**
   * Get user by email - FIXED
   */
  async function getUserByEmail(email: string, name?: string): Promise<DbUser> {
    try {
      // Try to find existing user
      const userResult = await query(
        "SELECT id, name, email, username FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length > 0) {
        return userResult.rows[0] as DbUser;
      }

      // Create new user if doesn't exist
      const username =
        name?.toLowerCase().replace(/\s+/g, "") || email.split("@")[0];
      const createResult = await query(
        `INSERT INTO users (name, email, username) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, email, username`,
        [name || email.split("@")[0], email, username]
      );

      const newUser = createResult.rows[0] as DbUser;
      console.log(
        `👤 Created new user: ${name || email} with ID: ${newUser.id}`
      );
      return newUser;
    } catch (error) {
      console.error("❌ Error getting/creating user:", error);
      throw error;
    }
  }

  /**
   * Create room - FIXED with proper transaction
   */
  async function createRoom(
    name: string,
    type: "dm" | "group" | "public_channel",
    createdByUserId: number,
    isPrivate: boolean = true
  ): Promise<DbRoom> {
    try {
      return await withTransaction(async (client) => {
        // Create room
        const roomResult = await client.query(
          `INSERT INTO rooms (name, type, created_by, is_private) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, name, type, created_by, is_private, created_at`,
          [name, type, createdByUserId, isPrivate]
        );
        const newRoom = roomResult.rows[0] as DbRoom;

        // Add creator as owner
        await client.query(
          `INSERT INTO room_members (room_id, user_id, role, added_by) 
           VALUES ($1, $2, 'owner', $3)`,
          [newRoom.id, createdByUserId, createdByUserId]
        );

        console.log(
          `🏗️ Created room: ${name} (ID: ${newRoom.id}) by user ${createdByUserId}`
        );
        return newRoom;
      });
    } catch (error) {
      console.error("❌ Error creating room:", error);
      throw error;
    }
  }

  /**
   * Get room list - FIXED
   */
  async function getRoomList(userId: number): Promise<DbRoomWithMemberCount[]> {
    try {
      const result = await query(
        `SELECT 
          r.id,
          r.name,
          r.type,
          r.created_by,
          r.is_private,
          r.created_at,
          COUNT(rm_all.user_id) as member_count
        FROM rooms r
        JOIN room_members rm_user ON r.id = rm_user.room_id AND rm_user.user_id = $1
        LEFT JOIN room_members rm_all ON r.id = rm_all.room_id
        GROUP BY r.id, r.name, r.type, r.created_by, r.is_private, r.created_at
        ORDER BY r.created_at DESC`,
        [userId]
      );
      return result.rows as DbRoomWithMemberCount[];
    } catch (error) {
      console.error("❌ Error fetching room list:", error);
      throw error;
    }
  }

  /**
   * Add member to room - FIXED
   */
  async function addMemberToRoom(
    roomId: number,
    email: string,
    addedByUserId: number
  ): Promise<{ success: boolean; user?: DbUser; error?: string }> {
    try {
      // Find user by email
      const userResult = await query(
        "SELECT id, name, email, username FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: `User with email ${email} not found` };
      }

      const user = userResult.rows[0] as DbUser;

      // Check if user is already in the room
      const checkResult = await query(
        "SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2",
        [roomId, user.id]
      );

      if (checkResult.rows.length > 0) {
        return {
          success: false,
          error: `User is already a member of this room`,
        };
      }

      // Add user to room
      await query(
        `INSERT INTO room_members (room_id, user_id, role, added_by) 
         VALUES ($1, $2, 'member', $3)`,
        [roomId, user.id, addedByUserId]
      );

      console.log(`👥 Added ${user.name} (${email}) to room ${roomId}`);
      return { success: true, user };
    } catch (error) {
      console.error("❌ Error adding member to room:", error);
      return { success: false, error: "Database error occurred" };
    }
  }

  /**
   * Save message - FIXED
   */
  async function saveMessage(
    roomId: number,
    userId: number,
    content: string
  ): Promise<{ id: number; sent_at: Date }> {
    try {
      const result = await query(
        `INSERT INTO messages (room_id, user_id, content, sent_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING id, sent_at`,
        [roomId, userId, content]
      );
      return result.rows[0];
    } catch (error) {
      console.error("❌ Error saving message:", error);
      throw error;
    }
  }

  /**
   * Load recent messages - FIXED
   */
  async function loadRecentMessages(
    roomId: number,
    limit: number = 50
  ): Promise<DbMessageWithUser[]> {
    try {
      const result = await query(
        `SELECT 
          m.id,
          m.content,
          m.sent_at,
          u.name as username,
          u.id as user_id
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.room_id = $1
        ORDER BY m.sent_at DESC
        LIMIT $2`,
        [roomId, limit]
      );
      return result.rows.reverse() as DbMessageWithUser[];
    } catch (error) {
      console.error("❌ Error loading messages:", error);
      throw error;
    }
  }

  /**
   * Get room by ID - FIXED
   */
  async function getRoomById(roomId: string | number): Promise<DbRoom | null> {
    try {
      const result = await query(
        "SELECT id, name, type, created_by, is_private, created_at FROM rooms WHERE id = $1",
        [Number(roomId)]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as DbRoom;
    } catch (error) {
      console.error("❌ Error getting room:", error);
      throw error;
    }
  }

  async function getUserById(userId: number): Promise<DbUser | null> {
    try {
      const result = await query(
        "SELECT id, name, email, username FROM users WHERE id = $1",
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as DbUser;
    } catch (error) {
      console.error("❌ Error getting user by ID:", error);
      throw error;
    }
  }

  // =============================================================================
  // SOCKET.IO EVENT HANDLERS - FIXED
  // =============================================================================

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // REMOVED: socket.join("general") - no more hardcoded room joins

    /**
     * Get rooms for a user - FIXED VERSION
     */
    socket.on("get_rooms", async (data: GetRoomsData) => {
      const { userId } = data;

      try {
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

        const user = await getUserById(userIdNum);
        if (!user) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        // FIXED: Ensure user has at least one room
        await ensureUserHasRoom(user.id);

        const roomList = await getRoomList(user.id);
        const rooms: Room[] = roomList.map((room) => ({
          id: room.id.toString(),
          name: room.name,
          memberCount: room.member_count,
          type: room.type as "dm" | "group" | "public_channel",
          isPrivate: room.is_private,
          createdBy: room.created_by.toString(),
          createdAt: room.created_at.toISOString(),
        }));

        socket.emit("rooms_list", { rooms });
        console.log(
          `📋 Sent ${rooms.length} rooms to user ${user.name} (ID: ${userId})`
        );
      } catch (error) {
        console.error("❌ Error fetching rooms:", error);
        socket.emit("error", { message: "Failed to fetch rooms" });
      }
    });

    /**
     * Join room - IMPROVED VERSION
     */
    socket.on("switch_room", async (data: SwitchRoomData) => {
      const { oldRoom, newRoom, username } = data;

      console.log(`🔄 ${username} switching from ${oldRoom} to ${newRoom}`);

      // FIXED: Validate new room ID
      const newRoomIdNum = parseInt(newRoom);
      if (isNaN(newRoomIdNum)) {
        console.error(`❌ Invalid new room ID: "${newRoom}"`);
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      // Track this socket's user and room
      socketToUser.set(socket.id, { username, room: newRoom });

      // Clean up typing in old room (only if oldRoom is valid)
      if (oldRoom && oldRoom !== "none") {
        if (typingUsers.has(oldRoom)) {
          typingUsers.get(oldRoom)!.delete(username);
          if (typingUsers.get(oldRoom)!.size === 0) {
            typingUsers.delete(oldRoom);
          }
          socket.to(oldRoom).emit("user_stopped_typing", {
            room: oldRoom,
            username,
            userId: data.userId || "unknown",
          });
        }
        socket.leave(oldRoom);
      }

      // Join new room
      socket.join(newRoom);

      try {
        const recentMessages = await loadRecentMessages(newRoomIdNum);

        const historyData: MessageHistoryData = {
          room: newRoom,
          messages: recentMessages.map((msg) => ({
            id: msg.id,
            message: msg.content,
            username: msg.username,
            userId: msg.user_id,
            timestamp: msg.sent_at.toISOString(),
            room: newRoom,
          })),
        };

        socket.emit("message_history", historyData);
        console.log(
          `📚 Loaded ${recentMessages.length} messages for room: ${newRoom}`
        );
      } catch (error) {
        console.error("❌ Error loading message history:", error);
        socket.emit("error", { message: "Failed to load message history" });
      }
    });

    /**
     * Create room - FIXED VERSION
     */
    socket.on("create_room", async (data: CreateRoomData) => {
      const { name, type, isPrivate, createdById } = data;

      try {
        const creatorIdNum = parseInt(createdById);
        const creator = await getUserById(creatorIdNum);

        if (!creator) {
          socket.emit("error", { message: "Creator not found" });
          return;
        }

        console.log(`🏗️ Creating room: ${name} (${type}) by ${creator.name}`);

        const newRoom = await createRoom(name, type, creator.id, isPrivate);

        const roomData: Room = {
          id: newRoom.id.toString(),
          name: newRoom.name,
          memberCount: 1,
          type: newRoom.type as "dm" | "group" | "public_channel",
          isPrivate: newRoom.is_private,
          createdBy: creator.id.toString(),
          createdAt: newRoom.created_at.toISOString(),
        };

        const createdData: RoomCreatedData = {
          room: roomData,
          createdBy: creator.name, // Use actual name from database
        };

        socket.emit("room_created", createdData);

        // Send updated room list
        const creatorRoomList = await getRoomList(creator.id);
        const creatorRooms: Room[] = creatorRoomList.map((room) => ({
          id: room.id.toString(),
          name: room.name,
          memberCount: room.member_count,
          type: room.type as "dm" | "group" | "public_channel",
          isPrivate: room.is_private,
          createdBy: room.created_by.toString(),
          createdAt: room.created_at.toISOString(),
        }));

        socket.emit("rooms_list", { rooms: creatorRooms });
        socket.join(newRoom.id.toString());

        console.log(
          `✅ Room created successfully: ${name} (ID: ${newRoom.id})`
        );
      } catch (error) {
        console.error("❌ Error creating room:", error);
        socket.emit("error", {
          message: "Failed to create room. Please try again.",
        });
      }
    });

    /**
     * Add member to room - FIXED VERSION
     */
    socket.on("add_member", async (data: AddMemberData) => {
      const { roomId, email, addedBy } = data;

      try {
        const roomIdNum = parseInt(roomId);
        const addedByIdNum = parseInt(addedBy);

        const addedByUser = await getUserById(addedByIdNum);
        if (!addedByUser) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        console.log(
          `👥 Adding user ${email} to room ${roomId} by ${addedByUser.name}`
        );

        const result = await addMemberToRoom(roomIdNum, email, addedByUser.id);

        if (result.success && result.user) {
          const memberAddedData: MemberAddedData = {
            roomId,
            email,
            success: true,
          };
          socket.emit("member_added", memberAddedData);

          // Send updated room lists
          const addedByRoomList = await getRoomList(addedByUser.id);
          const addedByRooms: Room[] = addedByRoomList.map((room) => ({
            id: room.id.toString(),
            name: room.name,
            memberCount: room.member_count,
            type: room.type as "dm" | "group" | "public_channel",
            isPrivate: room.is_private,
            createdBy: room.created_by.toString(),
            createdAt: room.created_at.toISOString(),
          }));

          socket.emit("rooms_list", { rooms: addedByRooms });

          const newMemberRoomList = await getRoomList(result.user.id);
          const newMemberRooms: Room[] = newMemberRoomList.map((room) => ({
            id: room.id.toString(),
            name: room.name,
            memberCount: room.member_count,
            type: room.type as "dm" | "group" | "public_channel",
            isPrivate: room.is_private,
            createdBy: room.created_by.toString(),
            createdAt: room.created_at.toISOString(),
          }));

          const userRoomsUpdate: UserRoomsUpdatedData = {
            userId: result.user.id.toString(),
            rooms: newMemberRooms,
          };
          io.emit("user_rooms_updated", userRoomsUpdate);

          console.log(`✅ Successfully added ${email} to room ${roomId}`);
        } else {
          socket.emit("error", {
            message: result.error || "Failed to add member",
          });
        }
      } catch (error) {
        console.error("❌ Error adding member:", error);
        socket.emit("error", { message: "Failed to add member to room" });
      }
    });

    /**
     * Send message - FIXED VERSION
     */
    socket.on("send_chat_message", async (data: SendMessageData) => {
      const { message, username, userId, room, tempId } = data;

      console.log(`📨 Message from ${username} in room ${room}: ${message}`);

      try {
        // FIXED: Validate room ID and user ID
        const roomIdNum = parseInt(room);
        const userIdNum = parseInt(userId);

        if (isNaN(roomIdNum)) {
          console.error(`❌ Invalid room ID: "${room}"`);
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        if (isNaN(userIdNum)) {
          console.error(`❌ Invalid user ID: "${userId}"`);
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

        // Verify room exists
        const roomData = await getRoomById(roomIdNum);
        if (!roomData) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        const savedMessage = await saveMessage(roomIdNum, userIdNum, message);

        const messageData: ChatMessageData = {
          id: savedMessage.id,
          message,
          username,
          userId: userIdNum,
          room,
          timestamp: savedMessage.sent_at.toISOString(),
          socketId: socket.id,
          tempId,
        };

        io.to(room).emit("chat_message", messageData);
        console.log(`📡 Message saved and broadcasted to room: ${room}`);
      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    /**
     * Switch room - FIXED VERSION
     */
    socket.on("switch_room", async (data: SwitchRoomData) => {
      const { oldRoom, newRoom, username } = data;

      console.log(`🔄 ${username} switching from ${oldRoom} to ${newRoom}`);

      // Track this socket's user and room
      socketToUser.set(socket.id, { username, room: newRoom });

      // Clean up typing in old room
      if (typingUsers.has(oldRoom)) {
        typingUsers.get(oldRoom)!.delete(username);
        if (typingUsers.get(oldRoom)!.size === 0) {
          typingUsers.delete(oldRoom);
        }
        socket.to(oldRoom).emit("user_stopped_typing", {
          room: oldRoom,
          username,
          userId: data.userId || "unknown",
        });
      }

      // Leave old room, join new room
      socket.leave(oldRoom);
      socket.join(newRoom);

      try {
        const roomIdNum = parseInt(newRoom);
        const recentMessages = await loadRecentMessages(roomIdNum);

        const historyData: MessageHistoryData = {
          room: newRoom,
          messages: recentMessages.map((msg) => ({
            id: msg.id,
            message: msg.content,
            username: msg.username,
            userId: msg.user_id,
            timestamp: msg.sent_at.toISOString(),
            room: newRoom,
          })),
        };

        socket.emit("message_history", historyData);
        console.log(
          `📚 Loaded ${recentMessages.length} messages for room: ${newRoom}`
        );
      } catch (error) {
        console.error("❌ Error loading message history:", error);
        socket.emit("error", { message: "Failed to load message history" });
      }
    });

    // FIXED: Typing indicators with proper tracking
    socket.on("user_typing_start", (data: TypingData) => {
      const { room, username, userId } = data;

      // Track this socket's user and room
      socketToUser.set(socket.id, { username, room });

      if (!typingUsers.has(room)) {
        typingUsers.set(room, new Set());
      }
      typingUsers.get(room)!.add(username);

      socket.to(room).emit("user_typing", { room, username, userId });
    });

    socket.on("user_typing_stop", (data: TypingData) => {
      const { room, username, userId } = data;

      if (typingUsers.has(room)) {
        typingUsers.get(room)!.delete(username);
        if (typingUsers.get(room)!.size === 0) {
          typingUsers.delete(room);
        }
      }

      socket.to(room).emit("user_stopped_typing", { room, username, userId });
    });

    // FIXED: Proper cleanup on disconnect
    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      // Clean up typing users when socket disconnects
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { username, room } = userInfo;

        // Remove from typing users
        if (typingUsers.has(room)) {
          typingUsers.get(room)!.delete(username);
          if (typingUsers.get(room)!.size === 0) {
            typingUsers.delete(room);
          }

          // Notify others that user stopped typing
          socket.to(room).emit("user_stopped_typing", {
            room,
            username,
            userId: "disconnected",
          });
        }

        // Remove from tracking
        socketToUser.delete(socket.id);
      }
    });
  });

  console.log("✅ Socket.io server started successfully");
  res.end();
}
