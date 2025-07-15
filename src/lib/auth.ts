// src/lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { createPool } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(createPool()),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          // Add username when we implement user creation
        },
      };
    },
  },
};

export default NextAuth(authOptions);

// Export types for TypeScript
export type { Session } from "next-auth";
