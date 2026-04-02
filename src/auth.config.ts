import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// auth.config.ts — Edge-safe: sem imports Node.js (path, bcrypt, prisma)
// Apenas declara os providers e callbacks sem se conectar ao banco.
// A validação real acontece no auth.ts (Node.js-only).
export const authConfig: NextAuthConfig = {
  providers: [
    // Declarado aqui para satisfazer o tipo NextAuthConfig,
    // mas a lógica de authorize só roda no servidor Node.js via auth.ts.
    Credentials({}),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/login";
      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/dashboard", nextUrl));
        return true;
      }
      if (!isLoggedIn) return false; // Redireciona para /login
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "babadoc-dev-secret-change-in-prod",
};
