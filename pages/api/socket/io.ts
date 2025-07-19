import { NextApiRequest } from "next";
import { Server as SocketIOServer } from "socket.io";
import { query, withTransaction } from "@/lib/db";
import type {
  SendMessageData,
  SwitchRoomData,
  TypingData,
  ChatMessageData,
  MessageHistoryData,
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
  RoomDeletedData,
  DeleteRoomData,
  GetUserData,
} from "@/types";

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
    res.end();
    return;
  }

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
  // DATABASE FUNCTIONS
  // =============================================================================

  async function ensureUserHasRoom(userId: number): Promise<void> {
    try {
      const roomCount = await query(
        `SELECT COUNT(*) as count FROM room_members WHERE user_id = $1`,
        [userId]
      );

      const count = parseInt(roomCount.rows[0].count);

      if (count === 0) {
        const defaultRoom = await createRoom(
          "General",
          "public_channel",
          userId,
          false
        );
      }
    } catch (error) {
      console.error("❌ Error ensuring user has room:", error);
    }
  }

  async function createRoom(
    name: string,
    type: "dm" | "group" | "public_channel",
    createdByUserId: number,
    isPrivate: boolean = true
  ): Promise<DbRoom> {
    try {
      return await withTransaction(async (client) => {
        const roomResult = await client.query(
          `INSERT INTO rooms (name, type, created_by, is_private) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, name, type, created_by, is_private, created_at`,
          [name, type, createdByUserId, isPrivate]
        );
        const newRoom = roomResult.rows[0] as DbRoom;

        await client.query(
          `INSERT INTO room_members (room_id, user_id, role, added_by) 
           VALUES ($1, $2, 'owner', $3)`,
          [newRoom.id, createdByUserId, createdByUserId]
        );

        return newRoom;
      });
    } catch (error) {
      console.error("❌ Error creating room:", error);
      throw error;
    }
  }

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

  async function addMemberToRoom(
    roomId: number,
    email: string,
    addedByUserId: number
  ): Promise<{ success: boolean; user?: DbUser; error?: string }> {
    try {
      const userResult = await query(
        "SELECT id, name, email, username FROM users WHERE email = $1",
        [email]
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: `User with email ${email} not found` };
      }

      const user = userResult.rows[0] as DbUser;

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

      await query(
        `INSERT INTO room_members (room_id, user_id, role, added_by) 
         VALUES ($1, $2, 'member', $3)`,
        [roomId, user.id, addedByUserId]
      );

      return { success: true, user };
    } catch (error) {
      console.error("❌ Error adding member to room:", error);
      return { success: false, error: "Database error occurred" };
    }
  }

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

  async function deleteRoom(roomId: number, deletedByUserId: number) {
    try {
      const room = await getRoomById(roomId);
      if (!room) {
        return { success: false, error: "Room not found" };
      }

      if (room.created_by !== deletedByUserId) {
        return {
          success: false,
          error: "Only the room creator can delete this room",
        };
      }

      return await withTransaction(async (client) => {
        await client.query("DELETE FROM messages WHERE room_id = $1", [roomId]);
        await client.query("DELETE FROM room_members WHERE room_id = $1", [
          roomId,
        ]);
        await client.query("DELETE FROM rooms WHERE id = $1", [roomId]);

        return { success: true, roomName: room.name };
      });
    } catch (error) {
      console.error("❌ Error deleting room:", error);
      return { success: false, error: "Database error occurred" };
    }
  }

  // =============================================================================
  // SOCKET.IO EVENT HANDLERS
  // =============================================================================

  io.on("connection", (socket) => {
    socket.on("get_user_info", async (data: GetUserData) => {
      const { userId } = data;

      try {
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

        const user = await getUserById(userIdNum);
        if (user) {
          socket.emit("user_info", {
            id: userId,
            name: user.name,
            email: (user.email && user.email) || "",
          });
        } else {
          socket.emit("error", { message: "User not found" });
        }
      } catch (error) {
        console.error("❌ Error getting user info:", error);
        socket.emit("error", { message: "Failed to get user info" });
      }
    });

    socket.on("delete_room", async (data: DeleteRoomData) => {
      const { roomId, deletedBy } = data;

      try {
        const roomIdNum = parseInt(roomId);
        const deletedByIdNum = parseInt(deletedBy);

        if (isNaN(roomIdNum) || isNaN(deletedByIdNum)) {
          socket.emit("error", { message: "Invalid room or user ID" });
          return;
        }

        const deletedByUser = await getUserById(deletedByIdNum);
        if (!deletedByUser) {
          socket.emit("error", { message: "User not found" });
          return;
        }

        const result = await deleteRoom(roomIdNum, deletedByUser.id);

        if (result.success) {
          const deletedData: RoomDeletedData = {
            roomId,
            deletedBy: deletedByUser.name,
            roomName:
              ("roomName" in result && result.roomName) || "Unknown Room",
          };

          io.emit("room_deleted", deletedData);
        } else {
          socket.emit("error", {
            message:
              ("error" in result && result.error) || "Failed to delete room",
          });
        }
      } catch (error) {
        console.error("❌ Error in delete_room handler:", error);
        socket.emit("error", { message: "Failed to delete room" });
      }
    });

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
      } catch (error) {
        console.error("❌ Error fetching rooms:", error);
        socket.emit("error", { message: "Failed to fetch rooms" });
      }
    });

    socket.on("switch_room", async (data: SwitchRoomData) => {
      const { oldRoom, newRoom, username } = data;

      const newRoomIdNum = parseInt(newRoom);
      if (isNaN(newRoomIdNum)) {
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }

      socketToUser.set(socket.id, { username, room: newRoom });

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
      } catch (error) {
        console.error("❌ Error loading message history:", error);
        socket.emit("error", { message: "Failed to load message history" });
      }
    });

    socket.on("create_room", async (data: CreateRoomData) => {
      const { name, type, isPrivate, createdById } = data;

      try {
        const creatorIdNum = parseInt(createdById);
        const creator = await getUserById(creatorIdNum);

        if (!creator) {
          socket.emit("error", { message: "Creator not found" });
          return;
        }

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
          createdBy: creator.name,
        };

        socket.emit("room_created", createdData);

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
      } catch (error) {
        console.error("❌ Error creating room:", error);
        socket.emit("error", {
          message: "Failed to create room. Please try again.",
        });
      }
    });

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

        const result = await addMemberToRoom(roomIdNum, email, addedByUser.id);

        if (result.success && result.user) {
          const memberAddedData: MemberAddedData = {
            roomId,
            email,
            success: true,
          };
          socket.emit("member_added", memberAddedData);

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

    socket.on("send_chat_message", async (data: SendMessageData) => {
      const { message, username, userId, room, tempId } = data;

      try {
        const roomIdNum = parseInt(room);
        const userIdNum = parseInt(userId);

        if (isNaN(roomIdNum)) {
          socket.emit("error", { message: "Invalid room ID" });
          return;
        }

        if (isNaN(userIdNum)) {
          socket.emit("error", { message: "Invalid user ID" });
          return;
        }

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
      } catch (error) {
        console.error("❌ Error processing message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("user_typing_start", (data: TypingData) => {
      const { room, username, userId } = data;

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

    socket.on("disconnect", () => {
      const userInfo = socketToUser.get(socket.id);
      if (userInfo) {
        const { username, room } = userInfo;

        if (typingUsers.has(room)) {
          typingUsers.get(room)!.delete(username);
          if (typingUsers.get(room)!.size === 0) {
            typingUsers.delete(room);
          }

          socket.to(room).emit("user_stopped_typing", {
            room,
            username,
            userId: "disconnected",
          });
        }

        socketToUser.delete(socket.id);
      }
    });
  });

  res.end();
}
