// components/typing-indicator.tsx
import type { TypingIndicatorProps } from "../types";

export default function TypingIndicator({
  typingUsers,
  className = "",
}: TypingIndicatorProps) {
  const getTypingText = (users: string[]) => {
    if (users.length === 0) return "";
    if (users.length === 1) return `${users[0]} is typing...`;
    if (users.length === 2) return `${users[0]} and ${users[1]} are typing...`;
    return `${users[0]} and ${users.length - 1} others are typing...`;
  };

  return (
    <div
      className={`bg-white border-gray-300 border-t border-r shadow-sm mr-28 z-0 rounded-tr-2xl text-gray-400 text-sm flex items-center p-3 transition-all duration-300 ease-in-out transform ${
        typingUsers.length > 0
          ? "translate-y-0 max-h-16"
          : "translate-y-7 max-h-0 overflow-hidden"
      } ${className}`}
    >
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <span>{getTypingText(typingUsers)}</span>
      </div>
    </div>
  );
}
