import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Middleware usa auth.config.ts (edge-safe) — sem Prisma/Node.js modules
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login$).*)",
  ],
};
