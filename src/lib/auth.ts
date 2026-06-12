import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          // Auto-register new users.
          // If the new user is "GymJones", automatically make them an admin.
          const isGymJones = credentials.username === "GymJones";
          const hashedPassword = await bcrypt.hash(credentials.password, 10);

          const newUser = await prisma.user.create({
            data: {
              username: credentials.username,
              passwordHash: hashedPassword,
              balance: 0, // Admin must add balance
              isAdmin: isGymJones, // True if GymJones, false otherwise
            },
          });

          return {
            id: newUser.id,
            name: newUser.username,
            isAdmin: newUser.isAdmin,
          };
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          name: user.username,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
