import { useSession } from "next-auth/react";
import AuthButton from "@/components/auth-button";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Chat App - Pages Router
        </h1>

        {session ? (
          <div className="text-center">
            <p className="mb-4">Welcome, {session.user?.name}!</p>
            <p className="text-sm text-gray-600 mb-4">{session.user?.email}</p>
            <AuthButton />
          </div>
        ) : (
          <div className="text-center">
            <p className="mb-4">Please sign in to continue</p>
            <AuthButton />
          </div>
        )}
      </div>
    </div>
  );
}
