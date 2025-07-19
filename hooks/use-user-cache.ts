import { useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { User } from "@/types";

interface UseUserCacheProps {
  socket: Socket | null;
}

interface UseUserCacheReturn {
  userCache: Map<string, string>;
  getUsernameById: (userId: string) => string;
  handleUserInfo: (data: User) => void;
  setUserCache: React.Dispatch<React.SetStateAction<Map<string, string>>>;
}

export function useUserCache({
  socket,
}: UseUserCacheProps): UseUserCacheReturn {
  const [userCache, setUserCache] = useState<Map<string, string>>(new Map());

  const handleUserInfo = useCallback((data: User) => {
    setUserCache((prev) => new Map(prev.set(data.id, data.name)));
  }, []);

  const getUsernameById = useCallback(
    (userId: string): string => {
      if (userCache.has(userId)) {
        return userCache.get(userId)!;
      }

      if (socket?.connected) {
        socket.emit("get_user_info", { userId });
      }

      return `User ${userId}`;
    },
    [userCache, socket]
  );

  return {
    userCache,
    getUsernameById,
    handleUserInfo,
    setUserCache,
  };
}
