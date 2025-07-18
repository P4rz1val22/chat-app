// components/chat-header.tsx
import { ExtendedSession } from "@/types";
import AuthButton from "./auth-button";

interface ChatHeaderProps {
  session: ExtendedSession;
  isConnected: boolean;
}

export default function ChatHeader({ session, isConnected }: ChatHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Chat App</h1>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <img
              src={session.user?.image || ""}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm text-gray-700">{session.user?.name}</span>
          </div>

          {/* Auth Button */}
          <AuthButton />
        </div>
      </div>
    </div>
  );
}
