// lib/auth.ts - FIXED FOR NEON
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { getPool } from "./db"; // Use our new pool function

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(getPool()), // Use the shared pool
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (user?.id) {
        return {
          ...session,
          user: {
            ...session.user,
            id: user.id,
          },
        };
      }
      return session;
    },

    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
  },

  session: {
    strategy: "database",
  },

  debug: process.env.NODE_ENV === "development",
};
