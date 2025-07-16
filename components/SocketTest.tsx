import { useState, useEffect } from "react";
import socketService from "../lib/socket";

export default function SocketTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string>("");
  const [testMessage, setTestMessage] = useState("");
  const [responses, setResponses] = useState<string[]>([]);

  useEffect(() => {
    // Connect to Socket.io server
    const socket = socketService.connect();

    // Update connection status
    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || "");
      console.log("🎉 Component: Connected to server");
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setSocketId("");
      console.log("💔 Component: Disconnected from server");
    };

    // Listen for test responses
    const handleTestResponse = (data: any) => {
      console.log("📨 Component: Received response:", data);
      setResponses((prev) => [...prev, `${data.message} (${data.timestamp})`]);
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("test_response", handleTestResponse);

    // Check if already connected
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup on unmount
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("test_response", handleTestResponse);
    };
  }, []);

  const sendTestMessage = () => {
    if (testMessage.trim()) {
      socketService.sendTestMessage(testMessage);
      setTestMessage("");
    }
  };

  const clearResponses = () => {
    setResponses([]);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Socket.io Test</h2>

      {/* Connection Status */}
      <div className="mb-4">
        <div
          className={`p-2 rounded ${
            isConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
        {socketId && (
          <div className="text-sm text-gray-600 mt-1">
            Socket ID: {socketId}
          </div>
        )}
      </div>

      {/* Test Message Input */}
      <div className="mb-4">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Enter test message"
          className="w-full p-2 border rounded"
          onKeyPress={(e) => e.key === "Enter" && sendTestMessage()}
        />
        <button
          onClick={sendTestMessage}
          disabled={!isConnected || !testMessage.trim()}
          className="mt-2 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
        >
          Send Test Message
        </button>
      </div>

      {/* Responses */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Responses:</h3>
          {responses.length > 0 && (
            <button
              onClick={clearResponses}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
        <div className="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded">
          {responses.length === 0 ? (
            <p className="text-gray-500 text-sm">No responses yet...</p>
          ) : (
            responses.map((response, index) => (
              <div key={index} className="text-sm mb-1 p-1 bg-white rounded">
                {response}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-400 mt-4">
        Open browser console for detailed logs
      </div>
    </div>
  );
}
