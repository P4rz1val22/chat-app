// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import SessionProvider from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Chat App",
  description: "Real-time chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={null}>{children}</SessionProvider>
      </body>
    </html>
  );
}
