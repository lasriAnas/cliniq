import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPatient } from "@/lib/portal-auth";
import { Button } from "@/components/ui/button";
import { portalSignOut } from "./actions";

const NAV = [
  { href: "/portal", label: "Home" },
  { href: "/portal/appointments", label: "Appointments" },
  { href: "/portal/prescriptions", label: "Prescriptions" },
  { href: "/portal/invoices", label: "Invoices" },
];

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const patient = await getCurrentPatient();

  if (!patient) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          {/* Brand */}
          <Link href="/portal" className="flex items-center gap-2 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-xs font-bold text-white">C</span>
            </div>
            <span className="font-semibold text-sm">CliniQ</span>
            <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5">
              Patient
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1 flex-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User + sign out */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {patient.name}
            </span>
            <form action={portalSignOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex sm:hidden gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
