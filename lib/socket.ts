import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (this.socket?.connected) {
      console.log("🔄 Already connected, returning existing socket");
      return this.socket;
    }

    console.log("🔌 Creating new Socket.io connection...");

    // Create connection with default path
    this.socket = io();

    // Connection event handlers
    this.socket.on("connect", () => {
      console.log("✅ Connected to Socket.io server:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from Socket.io server");
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
      console.log("🔌 Socket manually disconnected");
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Test function
  sendTestMessage(message: string): void {
    console.log("📤 Sending test message:", message);
    if (this.socket?.connected) {
      this.socket.emit("test_message", { message });
      console.log("📡 Message sent successfully");
    } else {
      console.log("❌ Socket not connected - cannot send message");
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
