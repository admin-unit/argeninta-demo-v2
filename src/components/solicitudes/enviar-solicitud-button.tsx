"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { avanzarSolicitud } from "@/app/actions/solicitudes";
import { cn } from "@/lib/utils";

export function EnviarSolicitudButton({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function send() {
    setError(null);
    const res = await avanzarSolicitud(solicitudId);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirming(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-[13.5px] font-semibold text-amber-900">
          Solicitud en borrador
        </h3>
        <p className="text-[12.5px] text-amber-800/80 mt-0.5">
          Revisá los datos arriba. Cuando esté lista, enviala para que entre al
          circuito de revisión.
        </p>
        {error && (
          <p className="text-[12px] text-red-700 mt-2 font-medium">⚠ {error}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="px-4 py-2 text-[13px] font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700"
          >
            → Enviar solicitud
          </button>
        ) : (
          <>
            <button
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="px-3 py-2 text-[12.5px] font-medium text-amber-900 hover:bg-amber-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={send}
              disabled={isPending}
              className={cn(
                "px-4 py-2 text-[13px] font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700",
                isPending && "opacity-60 cursor-not-allowed",
              )}
            >
              {isPending ? "Enviando…" : "✓ Confirmar y enviar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
