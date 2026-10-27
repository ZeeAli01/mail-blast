import { DashboardShell } from "@/components/DashboardShell";
import { requireUser } from "@/src/server/auth/authorization";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <DashboardShell userName={user.name}>{children}</DashboardShell>;
}
