"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Estado = "borrador" | "pendiente" | "en_proceso" | "finalizado" | "rechazado";

interface Expediente {
  id: string;
  nro: string;
  tipo: string;
  solicitante: string;
  organismo: string;
  estado: Estado;
  fecha: string;
}

const MOCK_DATA: Expediente[] = [
  {
    id: "1",
    nro: "EXP-2026-0001",
    tipo: "Gestión impositiva",
    solicitante: "Constructora Patagónica SA",
    organismo: "ARCA",
    estado: "en_proceso",
    fecha: "2026-05-02",
  },
  {
    id: "2",
    nro: "EXP-2026-0002",
    tipo: "Trámite aduanero",
    solicitante: "Importadora del Litoral SRL",
    organismo: "Aduana",
    estado: "pendiente",
    fecha: "2026-05-03",
  },
  {
    id: "3",
    nro: "EXP-2026-0003",
    tipo: "Gestión previsional",
    solicitante: "Textil Norte SA",
    organismo: "ANSES",
    estado: "finalizado",
    fecha: "2026-04-28",
  },
  {
    id: "4",
    nro: "EXP-2026-0004",
    tipo: "Gestión impositiva",
    solicitante: "Agropecuaria del Sur SA",
    organismo: "ARCA",
    estado: "rechazado",
    fecha: "2026-04-25",
  },
  {
    id: "5",
    nro: "EXP-2026-0005",
    tipo: "Habilitación municipal",
    solicitante: "Hotel Bariloche SRL",
    organismo: "Municipalidad",
    estado: "borrador",
    fecha: "2026-05-05",
  },
  {
    id: "6",
    nro: "EXP-2026-0006",
    tipo: "Trámite aduanero",
    solicitante: "Exportadora Pampeana SA",
    organismo: "Aduana",
    estado: "en_proceso",
    fecha: "2026-05-01",
  },
  {
    id: "7",
    nro: "EXP-2026-0007",
    tipo: "Gestión previsional",
    solicitante: "Clínica del Valle SRL",
    organismo: "ANSES",
    estado: "pendiente",
    fecha: "2026-05-04",
  },
  {
    id: "8",
    nro: "EXP-2026-0008",
    tipo: "Gestión impositiva",
    solicitante: "Distribuidora Cuyana SA",
    organismo: "ARCA",
    estado: "en_proceso",
    fecha: "2026-04-30",
  },
  {
    id: "9",
    nro: "EXP-2026-0009",
    tipo: "Habilitación municipal",
    solicitante: "Restaurante El Puerto SRL",
    organismo: "Municipalidad",
    estado: "finalizado",
    fecha: "2026-04-22",
  },
  {
    id: "10",
    nro: "EXP-2026-0010",
    tipo: "Gestión impositiva",
    solicitante: "Metalúrgica Rosario SA",
    organismo: "ARCA",
    estado: "pendiente",
    fecha: "2026-05-05",
  },
];

const ESTADOS: { value: Estado | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "borrador", label: "Borrador" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizado", label: "Finalizado" },
  { value: "rechazado", label: "Rechazado" },
];

const ESTADO_CONFIG: Record<
  Estado,
  { label: string; className: string; dot: string }
> = {
  borrador: {
    label: "Borrador",
    className: "bg-[--chart-5]/15 text-[--chart-5]",
    dot: "bg-[--chart-5]",
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    dot: "bg-amber-500",
  },
  en_proceso: {
    label: "En proceso",
    className: "bg-primary/8 text-primary border border-primary/20",
    dot: "bg-primary",
  },
  finalizado: {
    label: "Finalizado",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    dot: "bg-emerald-500",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-red-50 text-red-700 border border-red-200",
    dot: "bg-red-500",
  },
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ExpedientesTable() {
  const [filtroEstado, setFiltroEstado] = useState<Estado | "todos">("todos");
  const [search, setSearch] = useState("");

  const filtered = MOCK_DATA.filter((exp) => {
    const matchEstado =
      filtroEstado === "todos" || exp.estado === filtroEstado;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      exp.nro.toLowerCase().includes(q) ||
      exp.solicitante.toLowerCase().includes(q) ||
      exp.organismo.toLowerCase().includes(q) ||
      exp.tipo.toLowerCase().includes(q);
    return matchEstado && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ESTADOS.map((e) => (
            <button
              key={e.value}
              onClick={() => setFiltroEstado(e.value)}
              className={cn(
                "h-7 px-3 rounded-full text-[12.5px] font-medium transition-all duration-100",
                filtroEstado === e.value
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              {e.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar expediente..."
            className="h-8 pl-8 pr-3 w-56 rounded-lg border border-border bg-card text-[12.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/8 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Nro. Expediente
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Tipo de Trámite
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Solicitante
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Organismo
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Estado
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No se encontraron expedientes
                </td>
              </tr>
            )}
            {filtered.map((exp, i) => {
              const cfg = ESTADO_CONFIG[exp.estado];
              return (
                <tr
                  key={exp.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer",
                    i % 2 === 1 && "bg-muted/10"
                  )}
                >
                  <td className="px-4 py-3 font-mono text-[12px] font-medium text-foreground">
                    {exp.nro}
                  </td>
                  <td className="px-4 py-3 text-foreground">{exp.tipo}</td>
                  <td className="px-4 py-3 text-foreground">
                    {exp.solicitante}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {exp.organismo}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-medium",
                        cfg.className
                      )}
                    >
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)}
                      />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {formatDate(exp.fecha)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">
            {filtered.length} de {MOCK_DATA.length} expedientes
          </span>
          <span className="text-[11px] text-muted-foreground/60 italic">
            Datos de ejemplo — se actualizará con Odoo
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchIcon({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
