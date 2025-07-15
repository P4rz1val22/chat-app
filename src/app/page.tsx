// src/app/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { signIn, signOut } from "next-auth/react";
import AuthButton from "@/components/auth-button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chat App</h1>
          <p className="mb-4">Please sign in to continue</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Chat App!</h1>
        <div className="mb-4">
          <p>Hello, {session.user?.name}!</p>
          <p className="text-sm text-gray-600">{session.user?.email}</p>
        </div>
        <AuthButton />
      </div>
    </div>
  );
}
