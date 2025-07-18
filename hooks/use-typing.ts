// hooks/use-typing.ts
import { useState, useRef, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import type {
  TypingData,
  TypingEventData,
  UseTypingReturn,
  ExtendedSession,
} from "@/types";

interface UseTypingProps {
  socket: Socket | null;
  currentRoom: string;
  session: ExtendedSession | null;
}

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
    console.log("🔥 startTyping called", {
      socket: !!socket,
      connected: socket?.connected,
      session: !!session,
    });

    if (!socket?.connected || !session) {
      console.log("❌ startTyping blocked - socket or session missing");
      return;
    }

    if (!isTyping) {
      console.log("✅ Setting isTyping to true and emitting socket event");
      setIsTyping(true);
      const typingData: TypingData = {
        room: currentRoom,
        username: session.user?.name || "Anonymous",
        userId: session.user?.id || "unknown",
      };
      socket.emit("user_typing_start", typingData);
      console.log("📤 Emitted user_typing_start:", typingData);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
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
      // Clear existing debounce
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }

      if (value.trim()) {
        // Start typing after 500ms delay
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

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data: TypingEventData) => {
      const currentUserId = session?.user?.id;
      const isFromCurrentUser = data.userId === currentUserId;

      console.log("👂 Received user_typing:", {
        data,
        currentUserId,
        isFromCurrentUser,
        comparison: `${data.userId} === ${currentUserId}`,
        types: `${typeof data.userId} === ${typeof currentUserId}`,
      });

      if (data.room === currentRoom && !isFromCurrentUser) {
        console.log("✅ Adding typing user:", data.username);
        setTypingUsers((prev) => {
          const newUsers = !prev.includes(data.username)
            ? [...prev, data.username]
            : prev;
          console.log("👥 Updated typing users:", newUsers);
          return newUsers;
        });
      } else {
        console.log("❌ Typing user not added:", {
          wrongRoom: data.room !== currentRoom,
          isFromCurrentUser,
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

  // Cleanup on room change - ONLY depend on currentRoom
  useEffect(() => {
    console.log(
      "🏠 Room changed to:",
      currentRoom,
      "- stopping typing and clearing users"
    );
    stopTyping();
    clearTypingUsers();
  }, [currentRoom]); // Remove stopTyping and clearTypingUsers from dependencies

  // Cleanup on unmount
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
