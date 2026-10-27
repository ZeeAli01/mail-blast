import { SignOutButton } from "@/components/SignOutButton";
import {
  BarChart3,
  BookOpenText,
  ContactRound,
  CreditCard,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Shield,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const navigation = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Campaigns", "/dashboard/campaigns", Megaphone],
  ["Contacts", "/dashboard/contacts", ContactRound],
  ["Templates", "/dashboard/templates", BookOpenText],
  ["Reports", "/dashboard/reports", BarChart3],
  ["Team", "/dashboard/team", UsersRound],
  ["Billing & usage", "/dashboard/billing", CreditCard],
  ["Audit", "/dashboard/audit", Shield],
  ["Settings", "/dashboard/settings", Settings],
] as const;

export function DashboardShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#070711] text-slate-100 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-white/10 bg-black/20 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <Link
          href="/product"
          className="flex items-center gap-3 px-2 py-3 font-semibold"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600">
            <Mail size={17} />
          </span>
          MailBlast
        </Link>
        <nav
          className="mt-5 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1"
          aria-label="Workspace"
        >
          {navigation.map(([label, href, Icon]) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4 lg:absolute lg:bottom-4 lg:left-4 lg:right-4">
          <p className="mb-2 truncate px-3 text-xs text-slate-500">
            Signed in as {userName}
          </p>
          <SignOutButton />
        </div>
      </aside>
      <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
    </div>
  );
}
