"use client";

import { useState, useTransition } from "react";
import { updateAppointmentNotes, summarizeAppointmentNotes } from "@/app/dashboard/appointments/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NotebookPen, Sparkles } from "lucide-react";

interface AppointmentNotesDialogProps {
  appointmentId: string;
  initialNotes: string | null;
  canEdit: boolean;
}

export function AppointmentNotesDialog({
  appointmentId,
  initialNotes,
  canEdit,
}: AppointmentNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, start] = useTransition();
  const [isSummarizing, startSummarize] = useTransition();

  function handleSave() {
    start(async () => {
      await updateAppointmentNotes(appointmentId, notes);
      setOpen(false);
    });
  }

  const [summarizeError, setSummarizeError] = useState<string | null>(null);

  function handleSummarize() {
    setSummarizeError(null);
    startSummarize(async () => {
      const { summary, error } = await summarizeAppointmentNotes(notes);
      if (error) setSummarizeError(error);
      else setNotes(summary ?? notes);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={`p-1 rounded transition-colors ${
          initialNotes
            ? "text-primary hover:text-primary/80"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        }`}
        title={initialNotes ? "View / edit notes" : "Add notes"}
      >
        <NotebookPen className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointment Notes</DialogTitle>
        </DialogHeader>
        {canEdit ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter clinical notes…"
              rows={6}
              disabled={isPending || isSummarizing}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              {notes.trim() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarize}
                  disabled={isPending || isSummarizing}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isSummarizing ? "Summarizing…" : "Summarize with AI"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending || isSummarizing}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending || isSummarizing}>
                  {isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            {summarizeError && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                {summarizeError}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {initialNotes || "No notes recorded."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
