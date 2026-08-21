"use client";

// =============================================================================
// Valence — Lightweight Toast Notification System
//
// Usage:
//   <ToastProvider>  ← wrap at the root of any page that needs toasts
//   const { toast } = useToast();
//   toast("Saved!", "success");
// =============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4200;

function variantStyles(variant: ToastVariant): {
  ring: string;
  bg: string;
  icon: React.ReactNode;
  accent: string;
} {
  switch (variant) {
    case "success":
      return {
        ring: "border-emerald-500/30",
        bg: "bg-emerald-500/[0.06]",
        accent: "text-emerald-400",
        icon: <CheckCircle2 size={16} className="text-emerald-400" />,
      };
    case "error":
      return {
        ring: "border-red-500/30",
        bg: "bg-red-500/[0.06]",
        accent: "text-red-400",
        icon: <AlertCircle size={16} className="text-red-400" />,
      };
    default:
      return {
        ring: "border-cyan-500/30",
        bg: "bg-cyan-500/[0.06]",
        accent: "text-cyan-300",
        icon: <Info size={16} className="text-cyan-300" />,
      };
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info", durationMs = DEFAULT_DURATION) => {
      const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, variant, durationMs }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Fixed bottom-right toast stack */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <ToastRow key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastRow({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), item.durationMs - 300);
    const removeTimer = setTimeout(onDismiss, item.durationMs);
    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [item.durationMs, onDismiss]);

  const v = variantStyles(item.variant);

  return (
    <div
      className={[
        "pointer-events-auto rounded-xl border backdrop-blur-md px-4 py-3 shadow-xl shadow-black/30",
        "transition-all duration-300 ease-out",
        v.bg,
        v.ring,
        leaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
      ].join(" ")}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{v.icon}</div>
        <p className="text-sm text-gray-100 flex-1 leading-snug">{item.message}</p>
        <button
          onClick={() => setLeaving(true)}
          className="text-gray-500 hover:text-white transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}
