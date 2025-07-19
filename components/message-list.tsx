import { forwardRef } from "react";
import type { MessageListProps, MessageItemProps } from "../types";

function MessageItem({ message, isCurrentUser, onRetry }: MessageItemProps) {
  const initials = message.username.charAt(0).toUpperCase();
  const formattedTime = message.timestamp.split(":").slice(0, 2).join(":");

  return (
    <div className="flex space-x-3 max-w-4xl" role="listitem">
      <div className="flex-shrink-0">
        <div
          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-white text-sm font-medium">{initials}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{message.username}</span>
          <time
            className="text-sm text-gray-500"
            dateTime={message.timestamp}
            aria-label={`Sent at ${formattedTime}`}
          >
            {formattedTime}
          </time>

          {message.isOptimistic && (
            <span
              className="text-xs text-gray-400 flex items-center"
              aria-live="polite"
              aria-label="Message sending"
            >
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-pulse mr-1"
                aria-hidden="true"
              ></div>
              Sending...
            </span>
          )}
          {message.isFailed && (
            <button
              className="text-xs text-red-500 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              onClick={onRetry}
              aria-label={`Retry sending message: ${message.text}`}
            >
              ⚠️ Failed - Click to retry
            </button>
          )}
        </div>
        <p
          className={`mt-1 break-words whitespace-pre-wrap ${
            message.isOptimistic ? "text-gray-500" : "text-gray-700"
          } ${message.isFailed ? "text-red-400" : ""}`}
          aria-label={`Message from ${message.username}: ${message.text}`}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}

const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, currentUserId, onRetryMessage }, ref) => {
    const handleRetry = (messageId: string) => {
      if (onRetryMessage) {
        onRetryMessage(messageId);
      }
    };

    return (
      <main
        className="flex-1 overflow-y-auto p-6"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div
            className="text-center text-gray-500 py-8"
            role="status"
            aria-label="No messages in chat"
          >
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          <div
            role="list"
            aria-label={`${messages.length} messages`}
            className="space-y-4"
          >
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isCurrentUser={message.userId === currentUserId}
                onRetry={() => handleRetry(message.id)}
              />
            ))}
          </div>
        )}
        <div ref={ref} aria-hidden="true" />
      </main>
    );
  }
);

MessageList.displayName = "MessageList";

export default MessageList;
