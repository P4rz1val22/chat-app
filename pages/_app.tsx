// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  // Auto-initialize Socket.io server on app load
  useEffect(() => {
    console.log("🚀 Auto-initializing Socket.io server...");
    fetch("/api/socket/io")
      .then(() => console.log("✅ Socket.io server initialized"))
      .catch((error) =>
        console.log("⚠️ Socket.io initialization:", error.message)
      );
  }, []);

  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
