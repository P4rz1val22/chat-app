// types/index.ts
// 🎯 Centralized type definitions for the chat application

import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";
import { Socket as NetSocket } from "net";
import { NextApiResponse } from "next";
import { Session } from "next-auth";
import { Socket } from "socket.io-client";
import { PoolClient } from "pg";

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface Room {
  id: string;
  name: string;
  memberCount: number;
  type?: "dm" | "group" | "public_channel";
  isPrivate?: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  userId: string;
  roomId?: string;
  isOptimistic?: boolean;
  isFailed?: boolean;
  editedAt?: string;
}

export interface RoomMember {
  id: string;
  name: string;
  email?: string;
  username?: string;
  role: "owner" | "admin" | "member";
}

// =============================================================================
// SOCKET.IO EVENTS
// =============================================================================

export interface ClientToServerEvents {
  join_room: (data: JoinRoomData) => void;
  switch_room: (data: SwitchRoomData) => void;
  create_room: (data: CreateRoomData) => void;
  delete_room: (data: DeleteRoomData) => void;
  get_rooms: (data: GetRoomsData) => void;
  get_room_members: (data: GetRoomMembersData) => void;
  add_member: (data: AddMemberData) => void;
  get_user_info: (data: GetUserData) => void;
  send_chat_message: (data: SendMessageData) => void;
  user_typing_start: (data: TypingData) => void;
  user_typing_stop: (data: TypingData) => void;
  user_online: (data: PresenceData) => void;
  user_offline: (data: PresenceData) => void;
}

export interface ServerToClientEvents {
  connect: () => void;
  disconnect: () => void;
  chat_message: (data: ChatMessageData) => void;
  message_history: (data: MessageHistoryData) => void;
  message_error: (data: MessageErrorData) => void;
  room_created: (data: RoomCreatedData) => void;
  room_deleted: (data: RoomDeletedData) => void;
  rooms_list: (data: RoomListUpdateData) => void;
  room_members: (data: RoomMembersData) => void;
  member_added: (data: MemberAddedData) => void;
  user_rooms_updated: (data: UserRoomsUpdatedData) => void;
  user_info: (data: User) => void;
  user_typing: (data: TypingEventData) => void;
  user_stopped_typing: (data: TypingEventData) => void;
  user_presence_update: (data: PresenceUpdateData) => void;
  error: (error: ErrorData) => void;
}

// =============================================================================
// SOCKET EVENT DATA TYPES
// =============================================================================

export interface JoinRoomData {
  room: string;
  username: string;
  userId?: string;
}

export interface SwitchRoomData {
  oldRoom: string;
  newRoom: string;
  username: string;
  userId?: string;
}

export interface CreateRoomData {
  name: string;
  type: "dm" | "group" | "public_channel";
  isPrivate: boolean;
  createdById: string;
}

export interface DeleteRoomData {
  roomId: string;
  deletedBy: string;
}

export interface GetRoomsData {
  userId: string;
}

export interface GetRoomMembersData {
  roomId: string;
}

export interface GetUserData {
  userId: string;
}

export interface AddMemberData {
  roomId: string;
  email: string;
  addedBy: string;
}

export interface SendMessageData {
  message: string;
  username: string;
  userId: string;
  room: string;
  tempId: string;
}

export interface TypingData {
  room: string;
  username: string;
  userId: string;
}

export interface PresenceData {
  username: string;
  userId: string;
  room?: string;
}

export interface RoomCreatedData {
  room: Room;
  createdBy: string;
}

export interface RoomDeletedData {
  roomId: string;
  deletedBy: string;
  roomName: string;
}

export interface RoomListUpdateData {
  rooms: Room[];
}

export interface RoomMembersData {
  roomId: string;
  members: RoomMember[];
}

export interface MemberAddedData {
  roomId: string;
  email: string;
  success: boolean;
}

export interface UserRoomsUpdatedData {
  userId: string;
  rooms: Room[];
}

export interface ChatMessageData {
  id: number;
  message: string;
  username: string;
  userId: number;
  room: string;
  timestamp: string;
  socketId: string;
  tempId?: string;
}

export interface MessageHistoryData {
  room: string;
  messages: HistoryMessage[];
}

export interface HistoryMessage {
  id: number;
  message: string;
  username: string;
  userId: number;
  timestamp: string;
  room: string;
}

export interface MessageErrorData {
  tempId: string;
  message: string;
  error?: string;
}

export interface TypingEventData {
  room: string;
  username: string;
  userId: string;
}

export interface PresenceUpdateData {
  userId: string;
  username: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface ErrorData {
  message: string;
  code?: string;
  details?: any;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export interface TypingIndicatorProps {
  typingUsers: string[];
  className?: string;
}

export interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: CreateRoomForm) => void;
}

export interface ChatHeaderProps {
  session: ExtendedSession;
  isConnected: boolean;
}

export interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onRetryMessage?: (messageId: string) => void;
}

export interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  onRetry?: () => void;
}

export interface RoomSidebarProps {
  rooms: Room[];
  currentRoom: string;
  roomSearch: string;
  onRoomChange: (roomId: string) => void;
  onRoomSearchChange: (search: string) => void;
  onAddRoom?: () => void;
}

export interface RoomItemProps {
  room: Room;
  isActive: boolean;
  onClick: () => void;
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface RoomHeaderProps {
  currentRoom: string;
  rooms: Room[];
  onRoomSettingsClick?: () => void;
  onAddMembersClick?: () => void;
}

export interface UseTypingProps {
  socket: Socket | null;
  currentRoom: string;
  session: Session | null;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseSocketReturn {
  isConnected: boolean;
  socket: Socket | null;
  connect: () => Socket;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
}

export interface UseTypingReturn {
  typingUsers: string[];
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
  handleInputChange: (value: string) => void;
  clearTypingUsers: () => void;
}

export interface UseChatReturn {
  messages: Message[];
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  retryMessage: (messageId: string) => void;
}

export interface UseRoomsReturn {
  rooms: Room[];
  currentRoom: string;
  switchRoom: (roomId: string) => void;
  addRoom: (room: Omit<Room, "id">) => void;
  filteredRooms: Room[];
}

// =============================================================================
// NEXTAUTH TYPES
// =============================================================================

export interface ExtendedUser extends User {
  id: string;
}

export interface ExtendedSession extends Session {
  user: ExtendedUser;
}

export interface SessionCallbackParams {
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    expires: string;
  };
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface JWTCallbackParams {
  token: {
    id?: string;
    [key: string]: any;
  };
  user?: {
    id: string;
    [key: string]: any;
  };
}

// =============================================================================
// DATABASE TYPES
// =============================================================================

export interface DatabasePoolConfig {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  ssl: {
    rejectUnauthorized: boolean;
  };
}

export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

export interface DbRoom {
  id: number;
  name: string;
  type: string;
  created_by: number;
  is_private: boolean;
  created_at: Date;
}

export interface DbRoomWithMemberCount {
  id: number;
  name: string;
  type: string;
  created_by: number;
  is_private: boolean;
  created_at: Date;
  member_count: number;
}

export interface DbUser {
  id: number;
  name: string;
  email?: string;
  username: string;
}

export interface DbMessage {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  sent_at: Date;
}

export interface DbMessageWithUser {
  id: number;
  content: string;
  sent_at: Date;
  username: string;
  user_id: number;
}

// =============================================================================
// SOCKET SERVICE TYPES
// =============================================================================

export interface ISocketService {
  connect(): Socket;
  disconnect(): void;
  getSocket(): Socket | null;
}

export interface SocketServer extends NetServer {
  io?: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined;
}

export interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ConnectionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";
export type MessageStatus = "sending" | "sent" | "failed" | "delivered";
export type RoomType = "dm" | "group" | "public_channel";
export type UserRole = "owner" | "admin" | "member";
export type TypingState = "idle" | "typing" | "stopped";

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MessageResponse extends ApiResponse {
  data: {
    id: number;
    timestamp: string;
  };
}

export interface RoomResponse extends ApiResponse {
  data: Room;
}

export interface UserResponse extends ApiResponse {
  data: User;
}

// =============================================================================
// FORM TYPES
// =============================================================================

export interface CreateRoomForm {
  name: string;
  type: RoomType;
  isPrivate: boolean;
  description?: string;
}

export interface EditMessageForm {
  id: string;
  text: string;
}

export interface UserPreferences {
  notifications: boolean;
  soundEnabled: boolean;
  theme: "light" | "dark" | "system";
}
