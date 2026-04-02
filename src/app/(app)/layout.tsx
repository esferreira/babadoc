import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/app/(app)/components/Sidebar";
import { Topbar } from "@/app/(app)/components/Topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar userName={session.user?.name ?? session.user?.email ?? "Usuário"} userRole={(session.user as any)?.role ?? "member"} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0 transition-all">
        <Topbar userName={session.user?.name ?? session.user?.email ?? "Usuário"} userRole={(session.user as any)?.role ?? "member"} />
        {children}
      </div>
    </div>
  );
}
