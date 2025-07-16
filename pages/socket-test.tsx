import { useSession } from "next-auth/react";
import AuthButton from "../components/auth-button";
import SocketTest from "../components/SocketTest";

export default function SocketTestPage() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Socket.io Test</h1>
          <p className="mb-4">Please sign in to test Socket.io</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Socket.io Test Page</h1>
          <p className="text-gray-600">Welcome, {session.user?.name}!</p>
          <div className="mt-4">
            <AuthButton />
          </div>
        </div>

        <SocketTest />

        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            ✨ Open this page in multiple tabs to test real-time communication!
          </p>
          <p className="mt-2">
            🔍 Check browser console for detailed connection logs
          </p>
        </div>
      </div>
    </div>
  );
}
