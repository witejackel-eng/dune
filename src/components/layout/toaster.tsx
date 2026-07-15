"use client";

/**
 * Minimal toast notifier — replaces shadcn Toaster.
 * DUST//SIGNAL doesn't use toasts in normal flows, but we keep a simple
 * SSR-safe stub so the layout doesn't break.
 */
import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;
const listeners = new Set<(t: Toast) => void>();

export function toast(message: string) {
  const t = { id: ++toastId, message };
  listeners.forEach((fn) => fn(t));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 2400);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-mineral hairline px-4 py-2 font-mono text-[10px] tracking-[0.15em] uppercase text-amber"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
