import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardNav } from "@/components/dashboard-nav";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { ChatWidget } from "@/components/messages/chat-widget";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "./actions";
import { Settings } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";

const NAV_ITEMS: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard/reports",      label: "Reports",      roles: ["ADMIN"] },
  { href: "/dashboard/patients",     label: "Patients",     roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/dashboard/appointments", label: "Appointments", roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/dashboard/billing",      label: "Billing",      roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/dashboard/pharmacy",     label: "Pharmacy",     roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/dashboard/messages",     label: "Messages",     roles: ["ADMIN", "DOCTOR", "RECEPTIONIST"] },
  { href: "/dashboard/users",        label: "Users",        roles: ["ADMIN"] },
  { href: "/dashboard/audit-log",    label: "Audit log",    roles: ["ADMIN"] },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.mustChangePassword) {
    redirect("/change-password");
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(profile.role));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar text-sidebar-foreground print:hidden shrink-0 sticky top-0 h-screen">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-5 h-14 border-b border-sidebar-border hover:opacity-90 transition-opacity shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shrink-0">
            <span className="text-white font-bold text-sm leading-none">C</span>
          </div>
          <span className="font-semibold text-sidebar-foreground tracking-tight">CliniQ</span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DashboardNav items={visibleNavItems} />
        </div>
        <div className="border-t border-sidebar-border px-3 py-3 shrink-0">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent transition-colors group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-medium text-sm shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{profile.role}</p>
            </div>
            <Settings className="h-4 w-4 text-sidebar-foreground/40 shrink-0 group-hover:text-sidebar-foreground/70 transition-colors" />
          </Link>
          <form action={signOut} className="mt-1">
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-2 border-b px-4 py-3 print:hidden">
          {/* Mobile: hamburger + brand — hidden on desktop */}
          <MobileSidebar
            items={visibleNavItems}
            profileName={profile.name}
            profileRole={profile.role}
            profileInitial={profile.name.charAt(0).toUpperCase()}
            signOutAction={signOut}
          />
          <Link href="/dashboard" className="flex items-center gap-2 md:hidden mr-auto">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
              <span className="text-white font-bold text-xs leading-none">C</span>
            </div>
            <span className="font-semibold text-sm">CliniQ</span>
          </Link>
          {/* Push icons to the right on desktop */}
          <div className="flex items-center gap-1 ml-auto">
            <NotificationBell profileId={profile.id} />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 print:p-0">{children}</main>
      </div>
      <ChatWidget currentProfileId={profile.id} />
    </div>
  );
}
