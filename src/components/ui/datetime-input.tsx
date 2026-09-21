"use client";

import { forwardRef, useRef, useState, useEffect } from "react";

type DateTimeInputProps = {
  name?: string;
  value?: string;        // YYYY-MM-DDTHH:MM
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  min?: string;
  className?: string;
  disabled?: boolean;
};

function parse(iso: string) {
  if (!iso) return { d: "", m: "", y: "", h: "", mn: "" };
  const [datePart = "", timePart = ""] = iso.split("T");
  const [y = "", mo = "", d = ""] = datePart.split("-");
  const [h = "", mn = ""] = timePart.split(":");
  return { d, m: mo, y, h, mn };
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

function isValidTime(h: string, mn: string) {
  const hour = parseInt(h, 10);
  const min = parseInt(mn, 10);
  return !isNaN(hour) && !isNaN(min) && hour >= 0 && hour <= 23 && min >= 0 && min <= 59;
}

function assemble(d: string, m: string, y: string, h: string, mn: string) {
  if (
    d.length === 2 && m.length === 2 && y.length === 4 &&
    h.length === 2 && mn.length === 2 &&
    isValidDate(d, m, y) && isValidTime(h, mn)
  ) {
    return `${y}-${m}-${d}T${h}:${mn}`;
  }
  return "";
}

const FIELD_CLS =
  "h-9 rounded-md border border-input bg-transparent text-sm text-center shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50";

const ERROR_CLS = "border-destructive";

export const DateTimeInput = forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ name, value, defaultValue, onChange, required, className, disabled }, ref) => {
    const initial = parse(value ?? defaultValue ?? "");
    const [d, setD]   = useState(initial.d);
    const [m, setM]   = useState(initial.m);
    const [y, setY]   = useState(initial.y);
    const [h, setH]   = useState(initial.h);
    const [mn, setMn] = useState(initial.mn);
    const [error, setError] = useState("");

    const mRef  = useRef<HTMLInputElement>(null);
    const yRef  = useRef<HTMLInputElement>(null);
    const hRef  = useRef<HTMLInputElement>(null);
    const mnRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (value !== undefined) {
        const p = parse(value);
        setD(p.d); setM(p.m); setY(p.y); setH(p.h); setMn(p.mn);
        setError("");
      }
    }, [value]);

    function validate(nd: string, nm: string, ny: string, nh: string, nmn: string) {
      if (!nd && !nm && !ny && !nh && !nmn) { setError(""); return; }
      if (nd.length === 2 && nm.length === 2 && ny.length === 4) {
        if (!isValidDate(nd, nm, ny)) { setError("Invalid date"); return; }
      }
      if (nh.length === 2 && nmn.length === 2) {
        if (!isValidTime(nh, nmn)) { setError("Invalid time"); return; }
      }
      setError("");
    }

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

    function padAndValidate() {
      const pd  = d  && d.length  === 1 ? d.padStart(2,  "0") : d;
      const pm  = m  && m.length  === 1 ? m.padStart(2,  "0") : m;
      const ph  = h  && h.length  === 1 ? h.padStart(2,  "0") : h;
      const pmn = mn && mn.length === 1 ? mn.padStart(2, "0") : mn;
      if (pd !== d)   setD(pd);
      if (pm !== m)   setM(pm);
      if (ph !== h)   setH(ph);
      if (pmn !== mn) setMn(pmn);
      notify(pd, pm, y, ph, pmn);
      validate(pd, pm, y, ph, pmn);
    }

    const assembled = assemble(d, m, y, h, mn);
    const hasError = !!error;

    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`}>
        <div className="flex items-center gap-1 flex-wrap">
          {name && <input type="hidden" name={name} value={assembled} />}
          <input ref={ref} inputMode="numeric" placeholder="DD" value={d} onChange={handleD}
            onBlur={padAndValidate} required={required} disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`} />
          <span className="text-muted-foreground select-none">/</span>
          <input ref={mRef} inputMode="numeric" placeholder="MM" value={m} onChange={handleM}
            onBlur={padAndValidate} required={required} disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`} />
          <span className="text-muted-foreground select-none">/</span>
          <input ref={yRef} inputMode="numeric" placeholder="YYYY" value={y} onChange={handleY}
            onBlur={padAndValidate} required={required} disabled={disabled}
            className={`${FIELD_CLS} w-16 ${hasError ? ERROR_CLS : ""}`} />
          <span className="text-muted-foreground select-none mx-1">at</span>
          <input ref={hRef} inputMode="numeric" placeholder="HH" value={h} onChange={handleH}
            onBlur={padAndValidate} required={required} disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`} />
          <span className="text-muted-foreground select-none">:</span>
          <input ref={mnRef} inputMode="numeric" placeholder="MM" value={mn} onChange={handleMn}
            onBlur={padAndValidate} required={required} disabled={disabled}
            className={`${FIELD_CLS} w-11 ${hasError ? ERROR_CLS : ""}`} />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
DateTimeInput.displayName = "DateTimeInput";
