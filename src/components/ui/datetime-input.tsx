"use client";

import { forwardRef, useRef, useState, useEffect } from "react";

type DateTimeInputProps = {
  name?: string;
  value?: string;        // YYYY-MM-DDTHH:MM
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: string;          // YYYY-MM-DDTHH:MM
  className?: string;
  disabled?: boolean;
};

function parse(iso: string) {
  if (!iso) return { d: "", m: "", y: "", h: "", min: "" };
  const [datePart = "", timePart = ""] = iso.split("T");
  const [y = "", mo = "", d = ""] = datePart.split("-");
  const [h = "", mn = ""] = timePart.split(":");
  return { d, m: mo, y, h, min: mn };
}

function assemble(d: string, m: string, y: string, h: string, mn: string) {
  if (d.length === 2 && m.length === 2 && y.length === 4 && h.length === 2 && mn.length === 2) {
    return `${y}-${m}-${d}T${h}:${mn}`;
  }
  return "";
}

const FIELD_CLS =
  "h-9 rounded-md border border-input bg-transparent text-sm text-center shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ name, value, defaultValue, onChange, required, className, disabled }, ref) => {
    const initial = parse(value ?? defaultValue ?? "");
    const [d, setD]   = useState(initial.d);
    const [m, setM]   = useState(initial.m);
    const [y, setY]   = useState(initial.y);
    const [h, setH]   = useState(initial.h);
    const [mn, setMn] = useState(initial.min);

    const mRef  = useRef<HTMLInputElement>(null);
    const yRef  = useRef<HTMLInputElement>(null);
    const hRef  = useRef<HTMLInputElement>(null);
    const mnRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value !== undefined) {
        const p = parse(value);
        setD(p.d); setM(p.m); setY(p.y); setH(p.h); setMn(p.min);
      }
    }, [value]);

    function notify(nd: string, nm: string, ny: string, nh: string, nmn: string) {
      onChange?.(assemble(nd, nm, ny, nh, nmn));
    }

    function handleD(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setD(v); notify(v, m, y, h, mn);
      if (v.length === 2) mRef.current?.focus();
    }
    function handleM(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setM(v); notify(d, v, y, h, mn);
      if (v.length === 2) yRef.current?.focus();
    }
    function handleY(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
      setY(v); notify(d, m, v, h, mn);
      if (v.length === 4) hRef.current?.focus();
    }
    function handleH(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setH(v); notify(d, m, y, v, mn);
      if (v.length === 2) mnRef.current?.focus();
    }
    function handleMn(e: React.ChangeEvent<HTMLInputElement>) {
      const v = e.target.value.replace(/\D/g, "").slice(0, 2);
      setMn(v); notify(d, m, y, h, v);
    }

    const assembled = assemble(d, m, y, h, mn);

    return (
      <div className={`flex items-center gap-1 flex-wrap ${className ?? ""}`}>
        {name && <input type="hidden" name={name} value={assembled} />}
        <input ref={ref} inputMode="numeric" placeholder="DD" value={d} onChange={handleD}
          required={required} disabled={disabled} className={`${FIELD_CLS} w-11`} />
        <span className="text-muted-foreground select-none">/</span>
        <input ref={mRef} inputMode="numeric" placeholder="MM" value={m} onChange={handleM}
          required={required} disabled={disabled} className={`${FIELD_CLS} w-11`} />
        <span className="text-muted-foreground select-none">/</span>
        <input ref={yRef} inputMode="numeric" placeholder="YYYY" value={y} onChange={handleY}
          required={required} disabled={disabled} className={`${FIELD_CLS} w-16`} />
        <span className="text-muted-foreground select-none mx-1">at</span>
        <input ref={hRef} inputMode="numeric" placeholder="HH" value={h} onChange={handleH}
          required={required} disabled={disabled} className={`${FIELD_CLS} w-11`} />
        <span className="text-muted-foreground select-none">:</span>
        <input ref={mnRef} inputMode="numeric" placeholder="MM" value={mn} onChange={handleMn}
          required={required} disabled={disabled} className={`${FIELD_CLS} w-11`} />
      </div>
    );
  },
);
DateTimeInput.displayName = "DateTimeInput";
