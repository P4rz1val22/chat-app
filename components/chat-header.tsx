import { ChatHeaderProps, ExtendedSession } from "@/types";
import AuthButton from "./auth-button";
import Image from "next/image";

export default function ChatHeader({ session, isConnected }: ChatHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b" role="banner">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Chat App</h1>

        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2"
            role="status"
            aria-live="polite"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              aria-hidden="true"
            />
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Image
              src={session.user?.image || "/default-avatar.png"}
              alt={`${session.user?.name || "User"} profile picture`}
              className="w-8 h-8 rounded-full"
              loading="lazy"
            />
            <span
              className="text-sm text-gray-700"
              aria-label={`Signed in as ${session.user?.name}`}
            >
              {session.user?.name}
            </span>
          </div>

          <AuthButton />
        </div>
      </div>
    </header>
  );
}
