import { useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { Message, Room, SendMessageData, ExtendedSession } from "@/types";

interface UseMessagingProps {
  socket: Socket | null;
  session: ExtendedSession | null;
  currentRoom: string;
  rooms: Room[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  stopTyping: () => void;
  handleInputChange: (value: string) => void;
}

interface UseMessagingReturn {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  handleMessageInputChange: (value: string) => void;
}

export function useMessaging({
  socket,
  session,
  currentRoom,
  rooms,
  setMessages,
  stopTyping,
  handleInputChange,
}: UseMessagingProps): UseMessagingReturn {
  const [newMessage, setNewMessage] = useState("");

  const handleMessageInputChange = useCallback(
    (value: string) => {
      setNewMessage(value);
      handleInputChange(value);
    },
    [handleInputChange]
  );

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !session || !socket?.connected) return;

    if (!currentRoom || currentRoom === "") {
      return;
    }

    if (!session.user?.id) {
      return;
    }

    const currentRoomData = rooms.find((room) => room.id === currentRoom);
    if (!currentRoomData) {
      return;
    }

    stopTyping();

    const messageText = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const optimisticMessage: Message = {
      id: tempId,
      text: messageText,
      username: session.user?.name || "Anonymous",
      timestamp: new Date().toLocaleTimeString(),
      userId: session.user?.id || "unknown",
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    const sendData: SendMessageData = {
      message: messageText,
      username: session.user?.name || "Anonymous",
      userId: session.user?.id || "unknown",
      room: currentRoom,
      tempId: tempId,
    };

    socket.emit("send_chat_message", sendData);
  }, [
    newMessage,
    session,
    socket,
    currentRoom,
    rooms,
    stopTyping,
    setMessages,
  ]);

  return {
    newMessage,
    setNewMessage,
    sendMessage,
    handleMessageInputChange,
  };
}
