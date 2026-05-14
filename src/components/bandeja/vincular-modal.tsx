"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  InboxAttachment,
  InboxEmailDetail,
  SolicitudVinculable,
} from "@/lib/data";
import { vincularMailASolicitud } from "@/app/actions/inbox";

export function VincularModal({
  mail,
  attachments,
  onClose,
}: {
  mail: InboxEmailDetail;
  attachments: InboxAttachment[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SolicitudVinculable[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudVinculable | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Set<string>>(
    new Set(attachments.map((a) => a.id)),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoadingResults(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/inbox/search-solicitudes?q=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        if (!cancelled) setResults(data.results ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  function toggleAtt(id: string) {
    setSelectedAttachments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (!selectedSolicitud) return;
    setError(null);
    startTransition(async () => {
      const r = await vincularMailASolicitud(
        mail.id,
        selectedSolicitud.id,
        Array.from(selectedAttachments),
      );
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/30 shrink-0">
          <h2 className="text-[15px] font-semibold text-foreground">
            Vincular a solicitud existente
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            El mail queda en la bandeja; los adjuntos seleccionados se suman a la
            solicitud destino.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Solicitud destino
            </h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nº expediente o concepto…"
              className="w-full text-[13px] border border-border rounded-md px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
              autoFocus
            />
            <div className="mt-2 border border-border rounded-md max-h-48 overflow-y-auto bg-background">
              {loadingResults ? (
                <p className="px-3 py-2 text-[12.5px] text-muted-foreground">
                  Buscando…
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-2 text-[12.5px] text-muted-foreground">
                  Sin resultados.
                </p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {results.map((s) => {
                    const isSel = selectedSolicitud?.id === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => setSelectedSolicitud(s)}
                          className={cn(
                            "w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors",
                            isSel && "bg-primary/10",
                          )}
                        >
                          <p className="font-mono text-[12px] font-semibold text-foreground">
                            {s.numero_expediente ?? "(sin nro)"}
                          </p>
                          <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                            {s.concepto ?? "(sin concepto)"} ·{" "}
                            <span className="text-muted-foreground/70">{s.status}</span>
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Adjuntos a vincular
            </h3>
            {attachments.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground/70">
                El mail no tiene adjuntos para vincular.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAttachments.has(a.id)}
                        onChange={() => toggleAtt(a.id)}
                        className="rounded border-border"
                      />
                      <span className="text-[12.5px] text-foreground line-clamp-1 flex-1">
                        {a.filename}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={
              isPending || !selectedSolicitud || selectedAttachments.size === 0
            }
            className="px-4 py-2 text-[13px] font-semibold bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Vinculando…" : "→ Vincular"}
          </button>
        </div>
      </div>
    </div>
  );
}
