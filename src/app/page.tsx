import { redirect } from "next/navigation";

// O dashboard fica em (app)/page.tsx que serve /dashboard.
// Este redirect garante que / vai para /dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
