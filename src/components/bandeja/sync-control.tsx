"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncInboxNow } from "@/app/actions/inbox";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 10_000;

type Status =
  | { kind: "idle" }
  | { kind: "syncing" }
  | { kind: "ok"; synced: number; skipped: number; at: number }
  | { kind: "error"; message: string };

export function SyncControl() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const inFlight = useRef(false);

  const runSync = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus({ kind: "syncing" });
    try {
      const res = await syncInboxNow();
      if (res.ok) {
        setStatus({ kind: "ok", synced: res.synced, skipped: res.skipped, at: Date.now() });
        if (res.synced > 0) startTransition(() => router.refresh());
      } else {
        setStatus({ kind: "error", message: res.error });
      }
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") runSync();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const busy = status.kind === "syncing" || isPending;

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "text-[11.5px] tabular-nums",
          status.kind === "error" ? "text-red-600" : "text-muted-foreground",
        )}
        aria-live="polite"
      >
        {status.kind === "idle" && "Listo"}
        {status.kind === "syncing" && "Sincronizando…"}
        {status.kind === "ok" &&
          (status.synced > 0
            ? `+${status.synced} mail${status.synced !== 1 ? "s" : ""} (${formatTime(status.at)})`
            : `Sin novedades · ${formatTime(status.at)}`)}
        {status.kind === "error" && `Error: ${status.message.slice(0, 80)}`}
      </span>
      <button
        type="button"
        onClick={runSync}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
          "border-border bg-card hover:bg-accent disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        <svg
          className={cn("w-3.5 h-3.5", busy && "animate-spin")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 4v5h-5" />
        </svg>
        Sincronizar
      </button>
    </div>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
