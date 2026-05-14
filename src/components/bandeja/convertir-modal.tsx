"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { InboxAttachment, InboxEmailDetail } from "@/lib/data";
import { convertirMailASolicitud } from "@/app/actions/inbox";

export function ConvertirModal({
  mail,
  attachments,
  tiposGestion,
  onClose,
}: {
  mail: InboxEmailDetail;
  attachments: InboxAttachment[];
  tiposGestion: { id: string; slug: string; name: string }[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(attachments.map((a) => a.id)),
  );
  const [tipoSlug, setTipoSlug] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await convertirMailASolicitud(
        mail.id,
        Array.from(selected),
        tipoSlug,
      );
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push(`/solicitudes/${r.solicitudId}?from_inbox=true`);
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-[540px] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          <h2 className="text-[15px] font-semibold text-foreground">
            Convertir mail a solicitud
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Creamos un expediente nuevo con los datos del mail y los adjuntos
            que elijas.
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* Adjuntos */}
          <div>
            <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Adjuntos a vincular
            </h3>
            {attachments.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground/70">
                El mail no tiene adjuntos.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {attachments.map((a) => {
                  const isSel = selected.has(a.id);
                  return (
                    <li key={a.id}>
                      <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-muted/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(a.id)}
                          className="rounded border-border"
                        />
                        <span className="text-[12.5px] text-foreground line-clamp-1 flex-1">
                          {a.filename}
                        </span>
                        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                          {a.size_bytes ? `${Math.round(a.size_bytes / 1024)} KB` : "—"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Tipo */}
          <div>
            <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Tipo de gestión
            </h3>
            <select
              value={tipoSlug}
              onChange={(e) => setTipoSlug(e.target.value)}
              className="w-full text-[13px] border border-border rounded-md px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">— Elegí un tipo —</option>
              {tiposGestion.map((t) => (
                <option key={t.id} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-[12px] text-blue-900">
            Al crear, te llevamos al formulario nuevo con: De, Asunto, Fecha y{" "}
            <strong>{selected.size}</strong> archivo{selected.size !== 1 ? "s" : ""}{" "}
            ya cargado{selected.size !== 1 ? "s" : ""}.
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 text-[12.5px] text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-3 py-2 text-[13px] text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={isPending || !tipoSlug}
            className="px-4 py-2 text-[13px] font-semibold bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? "Creando…" : "→ Crear solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
