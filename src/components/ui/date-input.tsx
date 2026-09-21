"use client";

import { forwardRef, useRef, useState, useEffect } from "react";

type DateInputProps = {
  name?: string;
  value?: string;        // YYYY-MM-DD
  defaultValue?: string; // YYYY-MM-DD
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
};

function parse(iso: string) {
  if (!iso) return { d: "", m: "", y: "" };
  const [y, m, d] = iso.split("-");
  return { d: d ?? "", m: m ?? "", y: y ?? "" };
}

function daysInMonth(m: number, y: number) {
  return new Date(y, m, 0).getDate();
}

function isValidDate(d: string, m: string, y: string) {
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

function assemble(d: string, m: string, y: string) {
  if (d.length === 2 && m.length === 2 && y.length === 4 && isValidDate(d, m, y)) {
    return `${y}-${m}-${d}`;
  }
  return "";
}

const FIELD_CLS =
  "h-9 rounded-md border border-input bg-transparent text-sm text-center shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

const ERROR_CLS = "border-destructive";

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, value, defaultValue, onChange, required, className, disabled }, ref) => {
    const initial = parse(value ?? defaultValue ?? "");
    const [d, setD] = useState(initial.d);
    const [m, setM] = useState(initial.m);
    const [y, setY] = useState(initial.y);
    const [error, setError] = useState("");

    const mRef = useRef<HTMLInputElement>(null);
    const yRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value !== undefined) {
        const p = parse(value);
        setD(p.d); setM(p.m); setY(p.y);
        setError("");
      }
    }, [value]);

    function validate(nd: string, nm: string, ny: string) {
      if (!nd && !nm && !ny) { setError(""); return; }
      if (nd.length === 2 && nm.length === 2 && ny.length === 4) {
        if (!isValidDate(nd, nm, ny)) setError("Invalid date");
        else setError("");
      }
    }

    function notify(nd: string, nm: string, ny: string) {
      onChange?.(assemble(nd, nm, ny));
    }

    function handleD(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setD(v); notify(v, m, y);
      if (v.length === 2) mRef.current?.focus();
    }
    function handleM(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setM(v); notify(d, v, y);
      if (v.length === 2) yRef.current?.focus();
    }
    function handleY(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      setY(v); notify(d, m, v);
    }

    function padAndValidate() {
      const pd = d && d.length === 1 ? d.padStart(2, "0") : d;
      const pm = m && m.length === 1 ? m.padStart(2, "0") : m;
      if (pd !== d) setD(pd);
      if (pm !== m) setM(pm);
      const nd = pd, nm = pm, ny = y;
      notify(nd, nm, ny);
      validate(nd, nm, ny);
    }

    const assembled = assemble(d, m, y);
    const hasError = !!error;

    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <div className="flex items-center gap-1">
          {name && <input type="hidden" name={name} value={assembled} />}
          <input
            ref={ref}
            inputMode="numeric"
            placeholder="DD"
            value={d}
            onChange={handleD}
            onBlur={padAndValidate}
            required={required}
            disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`}
          />
          <span className="text-muted-foreground select-none">/</span>
          <input
            ref={mRef}
            inputMode="numeric"
            placeholder="MM"
            value={m}
            onChange={handleM}
            onBlur={padAndValidate}
            required={required}
            disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`}
          />
          <span className="text-muted-foreground select-none">/</span>
          <input
            ref={yRef}
            inputMode="numeric"
            placeholder="YYYY"
            value={y}
            onChange={handleY}
            onBlur={padAndValidate}
            required={required}
            disabled={disabled}
            className={`${FIELD_CLS} w-16 ${hasError ? ERROR_CLS : ""}`}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
DateInput.displayName = "DateInput";
