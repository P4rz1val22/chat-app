import { useState, useRef, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import { Session } from "next-auth";
import type {
  TypingData,
  TypingEventData,
  UseTypingProps,
  UseTypingReturn,
} from "@/types";

export function useTyping({
  socket,
  currentRoom,
  session,
}: UseTypingProps): UseTypingReturn {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback(() => {
    if (!socket?.connected || !session) {
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      const typingData: TypingData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
        userId: session.user?.id || "unknown",
      };
      socket.emit("user_typing_start", typingData);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, currentRoom, session, isTyping]);

  const stopTyping = useCallback(() => {
    if (!socket?.connected || !session) return;

    if (isTyping) {
      setIsTyping(false);
      const typingData: TypingData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
        userId: session.user?.id || "unknown",
      };
      socket.emit("user_typing_stop", typingData);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, currentRoom, session, isTyping]);

  const handleInputChange = useCallback(
    (value: string) => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }

      if (value.trim()) {
        typingDebounceRef.current = setTimeout(() => {
          startTyping();
        }, 500);
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping]
  );

  const clearTypingUsers = useCallback(() => {
    setTypingUsers([]);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: TypingEventData) => {
      const currentUserId = session?.user?.id;
      const isFromCurrentUser = data.userId === currentUserId;

      if (data.room === currentRoom && !isFromCurrentUser) {
        setTypingUsers((prev) => {
          const newUsers = !prev.includes(data.username)
            ? [...prev, data.username]
            : prev;
          return newUsers;
        });
      }
    };

    const handleUserStoppedTyping = (data: TypingEventData) => {
      const currentUserId = session?.user?.id;
      const isFromCurrentUser = data.userId === currentUserId;

      if (data.room === currentRoom && !isFromCurrentUser) {
        setTypingUsers((prev) => prev.filter((user) => user !== data.username));
      }
    };

    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);

    return () => {
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
    };
  }, [socket, currentRoom, session]);

  useEffect(() => {
    stopTyping();
    clearTypingUsers();
  }, [currentRoom, stopTyping, clearTypingUsers]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping,
    stopTyping,
    handleInputChange,
    clearTypingUsers,
  };
}
