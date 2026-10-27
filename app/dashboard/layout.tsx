import { DashboardShell } from "@/components/DashboardShell";
import { getCurrentUser } from "@/src/server/auth/authorization";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?callbackURL=%2Fdashboard");
  return <DashboardShell userName={user.name}>{children}</DashboardShell>;
}
