// types/index.ts
// 🎯 Centralized type definitions for the chat application

import { Session } from "next-auth";

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

// =============================================================================
// SOCKET.IO EVENTS
// =============================================================================

// Client to Server events
export interface ClientToServerEvents {
  // Room management
  join_room: (data: JoinRoomData) => void;
  switch_room: (data: SwitchRoomData) => void;

  // Messaging
  send_chat_message: (data: SendMessageData) => void;

  // Typing indicators
  user_typing_start: (data: TypingData) => void;
  user_typing_stop: (data: TypingData) => void;

  // Presence
  user_online: (data: PresenceData) => void;
  user_offline: (data: PresenceData) => void;
}

// Server to Client events
export interface ServerToClientEvents {
  // Connection status
  connect: () => void;
  disconnect: () => void;

  // Messages
  chat_message: (data: ChatMessageData) => void;
  message_history: (data: MessageHistoryData) => void;
  message_error: (data: MessageErrorData) => void;

  // Typing indicators
  user_typing: (data: TypingEventData) => void;
  user_stopped_typing: (data: TypingEventData) => void;

  // Presence
  user_presence_update: (data: PresenceUpdateData) => void;

  // General
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

export interface SendMessageData {
  message: string;
  username: string;
  userId: string;
  room: string;
  tempId: string;
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

export interface TypingData {
  room: string;
  username: string;
  userId: string;
}

export interface TypingEventData {
  room: string;
  username: string;
  userId: string;
}

export interface PresenceData {
  username: string;
  userId: string;
  room?: string;
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

export interface ChatHeaderProps {
  currentRoom: string;
  memberCount: number;
  isConnected: boolean;
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseSocketReturn {
  isConnected: boolean;
  socket: any; // Socket instance
  connect: () => void;
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
// EXTENDED NEXTAUTH TYPES
// =============================================================================

export interface ExtendedUser extends User {
  id: string;
}

export interface ExtendedSession extends Session {
  user: ExtendedUser;
}

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
