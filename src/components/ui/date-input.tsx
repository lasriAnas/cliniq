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

function assemble(d: string, m: string, y: string) {
  if (d.length === 2 && m.length === 2 && y.length === 4) {
    return `${y}-${m}-${d}`;
  }
  return "";
}

const FIELD_CLS =
  "h-9 rounded-md border border-input bg-transparent text-sm text-center shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ name, value, defaultValue, onChange, required, className, disabled }, ref) => {
    const initial = parse(value ?? defaultValue ?? "");
    const [d, setD] = useState(initial.d);
    const [m, setM] = useState(initial.m);
    const [y, setY] = useState(initial.y);

    const mRef = useRef<HTMLInputElement>(null);
    const yRef = useRef<HTMLInputElement>(null);

    // Sync controlled value
    useEffect(() => {
      if (value !== undefined) {
        const p = parse(value);
        setD(p.d);
        setM(p.m);
        setY(p.y);
      }
    }, [value]);

    function notify(nd: string, nm: string, ny: string) {
      onChange?.(assemble(nd, nm, ny));
    }

    function handleD(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setD(v);
      notify(v, m, y);
      if (v.length === 2) mRef.current?.focus();
    }

    function handleM(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setM(v);
      notify(d, v, y);
      if (v.length === 2) yRef.current?.focus();
    }

    function handleY(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      setY(v);
      notify(d, m, v);
    }

    const assembled = assemble(d, m, y);

    return (
      <div className={`flex items-center gap-1 ${className ?? ""}`}>
        {name && <input type="hidden" name={name} value={assembled} />}
        <input
          ref={ref}
          inputMode="numeric"
          placeholder="DD"
          value={d}
          onChange={handleD}
          required={required}
          disabled={disabled}
          className={`${FIELD_CLS} w-11`}
        />
        <span className="text-muted-foreground select-none">/</span>
        <input
          ref={mRef}
          inputMode="numeric"
          placeholder="MM"
          value={m}
          onChange={handleM}
          required={required}
          disabled={disabled}
          className={`${FIELD_CLS} w-11`}
        />
        <span className="text-muted-foreground select-none">/</span>
        <input
          ref={yRef}
          inputMode="numeric"
          placeholder="YYYY"
          value={y}
          onChange={handleY}
          required={required}
          disabled={disabled}
          className={`${FIELD_CLS} w-16`}
        />
      </div>
    );
  },
);
DateInput.displayName = "DateInput";
