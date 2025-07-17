// pages/index.tsx
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import AuthButton from "@/components/auth-button";
import socketService from "@/lib/socket";
import type {
  Message,
  Room,
  SendMessageData,
  ChatMessageData,
  JoinRoomData,
  SwitchRoomData,
  TypingData,
  MessageHistoryData,
  MessageErrorData,
  TypingEventData,
} from "../types";
import TypingIndicator from "@/components/typing-indicator";
import MessageList from "@/components/message-list";
import RoomSidebar from "@/components/room-sidebar";

export default function Home() {
  const { data: session } = useSession();
  const [currentRoom, setCurrentRoom] = useState("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [rooms, setRooms] = useState<Room[]>([
    { id: "general", name: "General", memberCount: 1 },
    { id: "random", name: "Random", memberCount: 0 },
    { id: "tech", name: "Tech Talk", memberCount: 0 },
  ]);
  const [roomSearch, setRoomSearch] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startTyping = () => {
    const socket = socketService.getSocket();
    if (!socket?.connected || !session) return;

    if (!isTyping) {
      setIsTyping(true);
      const typingData: TypingData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
        userId: (session as any).user?.id || "unknown",
      };
      socket.emit("user_typing_start", typingData);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    const socket = socketService.getSocket();
    if (!socket?.connected || !session) return;

    if (isTyping) {
      setIsTyping(false);
      const typingData: TypingData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
        userId: (session as any).user?.id || "unknown",
      };
      socket.emit("user_typing_stop", typingData);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!session) return;

    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      const joinData: JoinRoomData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
      };
      socket.emit("join_room", joinData);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleChatMessage = (data: ChatMessageData) => {
      if (data.room === currentRoom) {
        const message: Message = {
          id: data.id?.toString() || Date.now().toString(),
          text: data.message,
          username: data.username,
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          userId: data.userId?.toString() || "unknown",
          isOptimistic: false,
        };

        if (data.tempId) {
          setMessages((prev) => {
            const hasOptimisticMessage = prev.some(
              (msg) => msg.id === data.tempId
            );

            if (hasOptimisticMessage) {
              return prev.map((msg) =>
                msg.id === data.tempId
                  ? { ...message, id: data.id?.toString() || message.id }
                  : msg
              );
            } else {
              return [...prev, message];
            }
          });
        } else {
          setMessages((prev) => [...prev, message]);
        }
      }
    };

    const handleMessageHistory = (data: MessageHistoryData) => {
      if (data.room === currentRoom) {
        const historyMessages: Message[] = data.messages.map((msg) => ({
          id: msg.id?.toString() || Date.now().toString(),
          text: msg.message,
          username: msg.username,
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          userId: msg.userId?.toString() || "unknown",
          isOptimistic: false,
        }));

        setMessages(historyMessages);
      }
    };

    const handleMessageError = (data: MessageErrorData) => {
      if (data.tempId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.tempId
              ? { ...msg, isFailed: true, isOptimistic: false }
              : msg
          )
        );
      }
    };

    const handleUserTyping = (data: TypingEventData) => {
      const currentUserId = (session as any)?.user?.id;
      const isFromCurrentUser = data.userId === currentUserId;

      if (data.room === currentRoom && !isFromCurrentUser) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data: TypingEventData) => {
      const currentUserId = (session as any)?.user?.id;
      const isFromCurrentUser = data.userId === currentUserId;

      if (data.room === currentRoom && !isFromCurrentUser) {
        setTypingUsers((prev) => prev.filter((user) => user !== data.username));
      }
    };

    const handleError = (error: any) => {
      console.error("❌ Socket error:", error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("chat_message", handleChatMessage);
    socket.on("message_history", handleMessageHistory);
    socket.on("message_error", handleMessageError);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("error", handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("chat_message", handleChatMessage);
      socket.off("message_history", handleMessageHistory);
      socket.off("message_error", handleMessageError);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("error", handleError);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, [session, currentRoom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    if (e.target.value.trim()) {
      typingDebounceRef.current = setTimeout(() => {
        startTyping();
      }, 500);
    } else {
      stopTyping();
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !session) return;

    const socket = socketService.getSocket();
    if (!socket?.connected) return;

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    stopTyping();

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const optimisticMessage: Message = {
      id: tempId,
      text: messageText,
      username: session.user?.name || "Anonymous",
      timestamp: new Date().toLocaleTimeString(),
      userId: (session as any).user?.id || "unknown",
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    const sendData: SendMessageData = {
      message: messageText,
      username: session.user?.name || "Anonymous",
      userId: (session as any).user?.id || "unknown",
      room: currentRoom,
      tempId: tempId,
    };

    socket.emit("send_chat_message", sendData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(roomSearch.toLowerCase())
  );

  const switchRoom = (newRoomId: string) => {
    const socket = socketService.getSocket();

    stopTyping();

    if (socket?.connected) {
      const switchData: SwitchRoomData = {
        oldRoom: currentRoom,
        newRoom: newRoomId,
        username: session?.user?.name || "Anonymous",
      };
      socket.emit("switch_room", switchData);
    }

    setCurrentRoom(newRoomId);
    setMessages([]);
    setTypingUsers([]);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Chat App</h1>
          <div className="text-center">
            <p className="mb-4">Please sign in to continue</p>
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center px-6 py-4">
          <h1 className="text-xl font-bold text-gray-800">Chat App</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src={session.user?.image || ""}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm text-gray-700">
                {session.user?.name}
              </span>
            </div>
            <AuthButton />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        <RoomSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          roomSearch={roomSearch}
          onRoomChange={switchRoom}
          onRoomSearchChange={setRoomSearch}
          onAddRoom={() => {
            console.log("Add new room clicked");
            // You can implement room creation logic here later
          }}
        />

        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">#</span>
              <h2 className="text-lg font-semibold capitalize">
                {currentRoom}
              </h2>
              <span className="text-sm text-gray-500">
                • {rooms.find((r) => r.id === currentRoom)?.memberCount || 0}{" "}
                members
              </span>
            </div>
          </div>

          <MessageList
            messages={messages}
            currentUserId={(session as any)?.user?.id || "unknown"}
            onRetryMessage={(messageId) => {
              console.log("Retry message:", messageId);
              // You can implement retry logic here later
            }}
            ref={messagesEndRef}
          />
          <TypingIndicator typingUsers={typingUsers} />
          <div className="bg-white border-t border-gray-200 p-4 z-10">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentRoom}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
