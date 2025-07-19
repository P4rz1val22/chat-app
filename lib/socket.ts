import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io({
      transports: ["polling"], // Force polling only
      upgrade: false, // Don't try to upgrade to websockets
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket.io connection error:", error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
