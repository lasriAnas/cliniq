"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

interface MobileSidebarProps {
  items: NavItem[];
  profileName: string;
  profileRole: string;
  profileInitial: string;
  signOutAction: () => Promise<void>;
}

export function MobileSidebarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
      aria-label="Open navigation"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function MobileSidebar({
  items,
  profileName,
  profileRole,
  profileInitial,
  signOutAction,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Trigger button rendered in header */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-sidebar-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shrink-0">
              <span className="text-white font-bold text-sm leading-none">C</span>
            </div>
            <span className="font-semibold tracking-tight">CliniQ</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-sidebar-accent transition-colors"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <DashboardNav items={items} />
        </div>

        {/* User */}
        <div className="border-t border-sidebar-border px-3 py-3 shrink-0">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sidebar-accent transition-colors group"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-medium text-sm shrink-0">
              {profileInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{profileName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{profileRole}</p>
            </div>
            <Settings className="h-4 w-4 text-sidebar-foreground/40 shrink-0" />
          </Link>
          <form action={signOutAction} className="mt-1">
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
      </div>
    </>
  );
}
