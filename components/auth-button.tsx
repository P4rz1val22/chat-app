import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      Sign in with Google
    </button>
  );
}
