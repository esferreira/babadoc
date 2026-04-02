"use client";

import { Breadcrumbs } from "./Breadcrumbs";
import { SearchDialog } from "./SearchDialog";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface TopbarProps {
  userName: string;
  userRole: string;
}

export function Topbar({ userName, userRole }: TopbarProps) {
  return (
    <div className="flex items-center justify-between px-4 md:px-8 py-3 border-b sticky top-0 z-10" style={{ borderColor: "var(--border-muted)", background: "var(--bg-base)" }}>
      {/* Left side: Breadcrumbs */}
      <div className="flex items-center overflow-x-auto no-scrollbar">
        <Breadcrumbs />
      </div>
      
      {/* Right side: Tools & Profile */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <div className="hidden md:block">
          <SearchDialog />
        </div>
        <div className="md:hidden">
          <SearchDialog />
        </div>
        
        <div className="w-px h-5 mx-1 md:mx-2 hidden sm:block" style={{ background: "var(--border-muted)" }} />
        
        <div className="flex items-center gap-1">
          <NotificationBell />
          <ThemeToggle />
        </div>
        
        <div className="w-px h-5 mx-1 md:mx-2" style={{ background: "var(--border-muted)" }} />
        
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold leading-none" style={{ color: "var(--text-primary)" }}>
              {userName.split(" ")[0]}
            </div>
            <div className="text-[10px] uppercase mt-1" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              {userRole}
            </div>
          </div>
          <Link 
            href="/profile" 
            className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ring-2 ring-transparent hover:ring-[var(--accent)] transition-all" 
            style={{ background: "var(--accent-subtle)", color: "var(--accent-text)" }}
            title="Meu Perfil"
          >
            {userName.charAt(0).toUpperCase()}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs p-1.5 rounded-md transition-colors opacity-70 hover:opacity-100 hover:bg-red-500/10 hover:text-red-500"
            title="Sair"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
