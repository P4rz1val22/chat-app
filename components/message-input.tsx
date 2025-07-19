import { KeyboardEvent } from "react";
import type { MessageInputProps } from "@/types";

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
    }
  };

  const canSend = value.trim() && !disabled;

  return (
    <div className="bg-white border-t border-gray-200 p-4 z-10">
      <div className="flex space-x-4">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Message input"
          maxLength={1000}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </div>
  );
}
