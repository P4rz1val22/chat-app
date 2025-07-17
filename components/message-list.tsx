// components/message-list.tsx
import { forwardRef } from "react";
import type { MessageListProps, MessageItemProps } from "../types";

function MessageItem({ message, isCurrentUser, onRetry }: MessageItemProps) {
  return (
    <div className="flex space-x-3 max-w-4xl">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {message.username.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{message.username}</span>
          <span className="text-sm text-gray-500">
            {message.timestamp.split(":").slice(0, 2).join(":")}
          </span>

          {message.isOptimistic && (
            <span className="text-xs text-gray-400 flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-1"></div>
              Sending...
            </span>
          )}
          {message.isFailed && (
            <span
              className="text-xs text-red-500 cursor-pointer hover:underline"
              onClick={onRetry}
            >
              ⚠️ Failed - Click to retry
            </span>
          )}
        </div>
        <p
          className={`mt-1 break-words whitespace-pre-wrap ${
            message.isOptimistic ? "text-gray-500" : "text-gray-700"
          } ${message.isFailed ? "text-red-400" : ""}`}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}

// Main message list component
const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, currentUserId, onRetryMessage }, ref) => {
    const handleRetry = (messageId: string) => {
      if (onRetryMessage) {
        onRetryMessage(messageId);
      }
    };

    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isCurrentUser={message.userId === currentUserId}
              onRetry={() => handleRetry(message.id)}
            />
          ))
        )}
        <div ref={ref} />
      </div>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
