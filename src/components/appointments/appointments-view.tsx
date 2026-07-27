"use client";

import { useState } from "react";
import { LayoutList, CalendarDays } from "lucide-react";
import { AppointmentsTable, type AppointmentRow } from "@/components/appointments/appointments-table";
import { AppointmentsCalendar } from "@/components/appointments/appointments-calendar";

export type { AppointmentRow };

export function AppointmentsView({
  data,
  doctors,
  currentProfileId,
  currentRole,
}: {
  data: AppointmentRow[];
  doctors: { id: string; name: string }[];
  currentProfileId: string;
  currentRole: string;
}) {
  const [view, setView] = useState<"table" | "calendar">("table");

  return (
    <div className="flex flex-col gap-4">
      {/* View toggle */}
      <div className="flex w-fit gap-0.5 rounded-lg border bg-muted/50 p-1">
        <button
          type="button"
          onClick={() => setView("table")}
          className={[
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === "table"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <LayoutList className="h-4 w-4" />
          Table
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={[
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            view === "calendar"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <CalendarDays className="h-4 w-4" />
          Calendar
        </button>
      </div>

      {view === "table" ? (
        <AppointmentsTable
          data={data}
          doctors={doctors}
          currentProfileId={currentProfileId}
          currentRole={currentRole}
        />
      ) : (
        <AppointmentsCalendar
          data={data}
          doctors={doctors}
          currentProfileId={currentProfileId}
          currentRole={currentRole}
        />
      )}
    </div>
  );
}
