// hooks/use-socket.ts
import { useState, useEffect, useCallback } from "react";
import { Socket } from "socket.io-client";
import socketService from "@/lib/socket";
import type { UseSocketReturn } from "@/types";

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const connect = useCallback(() => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);
    return socketInstance;
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  const emit = useCallback((event: string, data: any) => {
    const socketInstance = socketService.getSocket();
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    } else {
      console.warn("⚠️ Cannot emit - socket not connected");
    }
  }, []);

  // Setup socket event listeners for connection state
  useEffect(() => {
    const socketInstance = socketService.getSocket();
    if (!socketInstance) return;

    const handleConnect = () => {
      console.log("✅ useSocket: Connected");
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log("❌ useSocket: Disconnected");
      setIsConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error("❌ useSocket: Connection error:", error);
      setIsConnected(false);
    };

    // Add listeners
    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    // Set initial state if already connected
    if (socketInstance.connected) {
      setIsConnected(true);
    }

    // Cleanup function
    return () => {
      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off("connect_error", handleConnectError);
    };
  }, [socket]);

  return {
    isConnected,
    socket,
    connect,
    disconnect,
    emit,
  };
}
