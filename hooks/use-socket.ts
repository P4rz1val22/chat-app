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
    }
  }, []);

  useEffect(() => {
    const socketInstance = socketService.getSocket();
    if (!socketInstance) return;

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = () => {
      setIsConnected(false);
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    if (socketInstance.connected) {
      setIsConnected(true);
    }

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
