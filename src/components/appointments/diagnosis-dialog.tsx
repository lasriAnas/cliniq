"use client";

import { useState, useTransition } from "react";
import { updateAppointmentDiagnosis, generatePatientAdvice } from "@/app/dashboard/appointments/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, Sparkles, Copy, Check } from "lucide-react";

interface DiagnosisDialogProps {
  appointmentId: string;
  initialDiagnosis: string | null;
  canEdit: boolean;
  isCompleted: boolean;
}

export function DiagnosisDialog({
  appointmentId,
  initialDiagnosis,
  canEdit,
  isCompleted,
}: DiagnosisDialogProps) {
  const [open, setOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis ?? "");
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [isGenerating, startGenerate] = useTransition();

  function handleSave() {
    startSave(async () => {
      await updateAppointmentDiagnosis(appointmentId, diagnosis);
      setOpen(false);
    });
  }

  function handleGenerateAdvice() {
    setAdviceError(null);
    startGenerate(async () => {
      try {
        const result = await generatePatientAdvice(diagnosis);
        setAdvice(result);
      } catch (err) {
        setAdviceError(err instanceof Error ? err.message : "Failed to generate advice. Check that ANTHROPIC_API_KEY is configured.");
      }
    });
  }

  async function handleCopy() {
    if (!advice) return;
    await navigator.clipboard.writeText(advice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const busy = isSaving || isGenerating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={`p-1 rounded transition-colors ${
          initialDiagnosis
            ? "text-primary hover:text-primary/80"
            : isCompleted
              ? "text-muted-foreground/40 hover:text-muted-foreground"
              : "text-muted-foreground/20 cursor-not-allowed"
        }`}
        title={
          !isCompleted
            ? "Diagnosis available once appointment is completed"
            : initialDiagnosis
              ? "View / edit diagnosis"
              : "Add diagnosis"
        }
        disabled={!isCompleted}
      >
        <Stethoscope className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Diagnosis</DialogTitle>
        </DialogHeader>
        {canEdit ? (
          <div className="flex flex-col gap-3">
            <Textarea
              value={diagnosis}
              onChange={(e) => { setDiagnosis(e.target.value); setAdvice(null); setAdviceError(null); }}
              placeholder="Enter diagnosis…"
              rows={3}
              disabled={busy}
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-2">
              {diagnosis.trim() ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateAdvice}
                  disabled={busy}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isGenerating ? "Generating…" : "Generate patient advice"}
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={busy}>
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
            {adviceError && (
              <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                {adviceError}
              </p>
            )}
            {advice && (
              <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Patient Advice
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{advice}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {initialDiagnosis || "No diagnosis recorded."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
