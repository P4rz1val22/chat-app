import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import AuthButton from "@/components/auth-button";
import ChatHeader from "@/components/chat-header";
import TypingIndicator from "@/components/typing-indicator";
import MessageList from "@/components/message-list";
import RoomSidebar from "@/components/room-sidebar";
import MessageInput from "@/components/message-input";
import RoomHeader from "@/components/room-header";
import CreateRoomModal from "@/components/create-room-modal";
import RoomManageModal from "@/components/room-manage-modal";
import { useSocket } from "@/hooks/use-socket";
import { useTyping } from "@/hooks/use-typing";
import { useRoomManagement } from "@/hooks/use-room-management";
import { useUserCache } from "@/hooks/use-user-cache";
import { useMessaging } from "@/hooks/use-messaging";
import type {
  Message,
  Room,
  SendMessageData,
  ChatMessageData,
  JoinRoomData,
  SwitchRoomData,
  MessageHistoryData,
  MessageErrorData,
  ExtendedSession,
  CreateRoomForm,
  User,
} from "../types";

export default function Home() {
  const { data: session } = useSession();
  const [currentRoom, setCurrentRoom] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isRoomManageModalOpen, setIsRoomManageModalOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected, connect } = useSocket();
  const { typingUsers, startTyping, stopTyping, handleInputChange } = useTyping(
    {
      socket,
      currentRoom,
      session: session as ExtendedSession,
    }
  );

  const { getUsernameById, handleUserInfo, setUserCache } = useUserCache({
    socket,
  });

  const {
    filteredRooms,
    currentRoomName,
    handleCreateRoom,
    handleDeleteRoom,
    handleAddMember,
    switchRoom,
  } = useRoomManagement({
    socket,
    session: session as ExtendedSession,
    rooms,
    currentRoom,
    roomSearch,
    setCurrentRoom,
    setMessages,
    stopTyping,
  });

  const { newMessage, sendMessage, handleMessageInputChange } = useMessaging({
    socket,
    session: session as ExtendedSession,
    currentRoom,
    rooms,
    setMessages,
    stopTyping,
    handleInputChange,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!session) return;

    const socketInstance = connect();

    const handleConnect = () => {
      socketInstance.emit("get_rooms", {
        userId: session.user?.id || "",
      });
    };

    const handleRoomDeleted = (data: {
      roomId: string;
      deletedBy: string;
      roomName: string;
    }) => {
      setRooms((prev) => prev.filter((room) => room.id !== data.roomId));

      if (currentRoom === data.roomId) {
        const remainingRooms = rooms.filter((room) => room.id !== data.roomId);
        if (remainingRooms.length > 0) {
          const firstRoom = remainingRooms[0];
          setCurrentRoom(firstRoom.id);
          setMessages([]);

          if (socket?.connected) {
            const joinData: JoinRoomData = {
              room: firstRoom.id,
              username: session?.user?.name || "Anonymous",
            };
            socket.emit("join_room", joinData);
          }
        } else {
          setCurrentRoom("");
          setMessages([]);
        }
      }
    };

    const handleRoomsList = (data: { rooms: Room[] }) => {
      setRooms(data.rooms);

      if (isInitialLoad && data.rooms.length > 0 && !currentRoom) {
        const firstRoom = data.rooms[0];
        setCurrentRoom(firstRoom.id);
        setIsInitialLoad(false);

        if (firstRoom.id && firstRoom.id !== "") {
          const joinData: JoinRoomData = {
            room: firstRoom.id,
            username: session.user?.name || "Anonymous",
          };
          socketInstance.emit("join_room", joinData);
        }
      }
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

    const handleError = (error: any) => {
      console.error("❌ Socket error:", error);
    };

    const handleRoomCreated = (data: any) => {
      setRooms((prev) => [...prev, data.room]);

      if (data.createdBy === session.user?.name) {
        setCurrentRoom(data.room.id);
        setMessages([]);
        setIsInitialLoad(false);
      }
    };

    const handleUserRoomsUpdated = (data: {
      userId: string;
      rooms: Room[];
    }) => {
      const currentUserId = (session as any)?.user?.id?.toString();
      if (data.userId === currentUserId) {
        setRooms(data.rooms);
      }
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("chat_message", handleChatMessage);
    socketInstance.on("message_history", handleMessageHistory);
    socketInstance.on("user_info", handleUserInfo);
    socketInstance.on("message_error", handleMessageError);
    socketInstance.on("room_created", handleRoomCreated);
    socketInstance.on("rooms_list", handleRoomsList);
    socketInstance.on("user_rooms_updated", handleUserRoomsUpdated);
    socketInstance.on("room_deleted", handleRoomDeleted);
    socketInstance.on("error", handleError);

    if (socketInstance.connected) {
      handleConnect();
    }

    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("chat_message", handleChatMessage);
      socketInstance.off("message_history", handleMessageHistory);
      socketInstance.off("user_info", handleUserInfo);
      socketInstance.off("message_error", handleMessageError);
      socketInstance.off("room_created", handleRoomCreated);
      socketInstance.off("rooms_list", handleRoomsList);
      socketInstance.off("user_rooms_updated", handleUserRoomsUpdated);
      socketInstance.off("room_deleted", handleRoomDeleted);
      socketInstance.off("error", handleError);
    };
  }, [session, currentRoom, connect, isInitialLoad, handleUserInfo]);

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

  if (isInitialLoad && rooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ChatHeader
          session={session as ExtendedSession}
          isConnected={isConnected}
        />
        <div className="flex h-[calc(100vh-73px)] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100">
        <ChatHeader
          session={session as ExtendedSession}
          isConnected={isConnected}
        />
        <div className="flex h-[calc(100vh-73px)] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No rooms available
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first room to start chatting!
            </p>
            <button
              onClick={() => setIsCreateRoomModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ChatHeader
        session={session as ExtendedSession}
        isConnected={isConnected}
      />

      <div className="flex h-[calc(100vh-73px)]">
        <RoomSidebar
          rooms={filteredRooms}
          currentRoom={currentRoom}
          roomSearch={roomSearch}
          onRoomChange={switchRoom}
          onRoomSearchChange={setRoomSearch}
          onAddRoom={() => setIsCreateRoomModalOpen(true)}
        />

        <div className="flex-1 flex flex-col">
          {currentRoom ? (
            <>
              <RoomHeader
                currentRoom={currentRoom}
                rooms={rooms}
                onRoomSettingsClick={() => setIsRoomManageModalOpen(true)}
              />
              <MessageList
                messages={messages}
                currentUserId={session.user?.id || "unknown"}
                onRetryMessage={(messageId) => {
                  console.log("Retry message:", messageId);
                }}
                ref={messagesEndRef}
              />
              <TypingIndicator typingUsers={typingUsers} />
              <MessageInput
                value={newMessage}
                onChange={handleMessageInputChange}
                onSend={sendMessage}
                disabled={!isConnected}
                placeholder={`Message #${currentRoomName}`}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Select a room to start chatting
                </h2>
                <p className="text-gray-600">Choose a room from the sidebar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
      />

      <RoomManageModal
        isOpen={isRoomManageModalOpen}
        onClose={() => setIsRoomManageModalOpen(false)}
        room={rooms.find((room) => room.id === currentRoom) || null}
        onAddMember={handleAddMember}
        onDeleteRoom={handleDeleteRoom}
        roomCreator={getUsernameById(
          rooms.find((room) => room.id === currentRoom)?.createdBy || ""
        )}
      />
    </div>
  );
}
