"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AuditLogEvent } from "@/lib/data";

const EVENT_LABEL: Record<string, string> = {
  mail_received: "Mail recibido",
  mail_routed: "Mail derivado",
  mail_marked_read: "Marcado como leído",
  mail_discarded: "Mail descartado",
  mail_converted_to_solicitud: "Convertido a solicitud",
  mail_linked_to_solicitud: "Adjuntos vinculados a solicitud",
  note_added: "Nota interna",
};

function formatFechaHora(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("es-AR")} ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function userInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name?.trim() || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function eventoLabel(ev: AuditLogEvent): string {
  if (ev.description) return ev.description;
  return EVENT_LABEL[ev.event_type] ?? ev.event_type;
}

export function MailTrazabilidad({ historial }: { historial: AuditLogEvent[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const desc = [...historial].reverse();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Trazabilidad</h2>
        <span className="text-[12px] text-muted-foreground">
          {historial.length} evento{historial.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="p-5">
        {desc.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Aún no hay eventos registrados.
          </p>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-4 bottom-2 w-px bg-border" />
            <div className="space-y-3">
              {desc.map((ev, idx) => {
                const userName = ev.user?.full_name || ev.user?.email || "Sistema";
                const isExpanded = expandedId === ev.id;
                const otherMeta = ev.metadata
                  ? Object.entries(ev.metadata).filter(([k]) => k !== "note")
                  : [];
                return (
                  <div key={ev.id} className="relative">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      className={cn(
                        "w-full flex gap-4 relative text-left rounded-lg px-2 -ml-2 py-2 transition-colors",
                        isExpanded ? "bg-muted/40" : "hover:bg-muted/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-[10px] font-bold ring-2 ring-background",
                          idx === 0
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted border border-border text-muted-foreground",
                        )}
                      >
                        {idx === 0 ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3" strokeWidth={2.5} fill="currentColor" />
                          </svg>
                        ) : (
                          userInitials(ev.user?.full_name, ev.user?.email)
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13.5px] font-semibold text-foreground leading-snug truncate">
                            {eventoLabel(ev)}
                          </p>
                          <svg
                            className={cn(
                              "w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {userName}
                          {ev.area?.name ? ` · ${ev.area.name}` : ""} · {formatFechaHora(ev.created_at)}
                        </p>
                        {typeof ev.metadata?.note === "string" && (
                          <p className="mt-2 text-[12.5px] text-foreground/80 bg-muted rounded-lg px-3 py-2 border border-border/60">
                            {ev.metadata.note as string}
                          </p>
                        )}
                      </div>
                    </button>

                    {isExpanded && otherMeta.length > 0 && (
                      <div className="ml-10 mt-2 mb-1 p-3.5 rounded-lg border border-border bg-background">
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                          <span className="text-muted-foreground font-medium">Evento</span>
                          <span className="font-mono text-foreground">{ev.event_type}</span>
                          {otherMeta.map(([k, v]) => (
                            <span key={k} className="contents">
                              <span className="text-muted-foreground font-medium">{k}</span>
                              <span className="font-mono text-foreground break-all">
                                {typeof v === "object" ? JSON.stringify(v) : String(v)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
