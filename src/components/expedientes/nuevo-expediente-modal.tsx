"use client";

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface NuevoExpedienteModalProps {
  open: boolean;
  onClose: () => void;
}

const TIPOS_TRAMITE = [
  "Gestión impositiva",
  "Trámite aduanero",
  "Gestión previsional",
  "Habilitación municipal",
];

const ORGANISMOS = ["ARCA", "Aduana", "ANSES", "Municipalidad", "Otro"];

interface FormState {
  tipo: string;
  caracter: "normal" | "urgente";
  solicitante: string;
  organismo: string;
}

export function NuevoExpedienteModal({ open, onClose }: NuevoExpedienteModalProps) {
  const [form, setForm] = useState<FormState>({
    tipo: "",
    caracter: "normal",
    solicitante: "",
    organismo: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files).filter(
      (f) => f.type === "application/pdf"
    );
    setFiles((prev) => [...prev, ...selected]);
  };

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: conectar a Supabase
    console.log("Nuevo expediente:", { ...form, files });
    handleClose();
  }

  function handleClose() {
    setForm({ tipo: "", caracter: "normal", solicitante: "", organismo: "" });
    setFiles([]);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-[520px] mx-4 bg-card rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-border flex flex-col max-h-[90vh]"
        style={{ animation: "modal-in 180ms ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground tracking-tight">
              Nuevo expediente
            </h2>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">
              Completá los datos del trámite
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <XIcon size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            {/* Tipo de trámite */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-foreground">
                Tipo de trámite
              </label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                required
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Seleccioná un tipo
                </option>
                {TIPOS_TRAMITE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Solicitante */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-foreground">
                Solicitante
              </label>
              <input
                type="text"
                value={form.solicitante}
                onChange={(e) =>
                  setForm({ ...form, solicitante: e.target.value })
                }
                placeholder="Empresa o persona"
                required
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Organismo + Carácter en fila */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12.5px] font-medium text-foreground">
                  Organismo
                </label>
                <select
                  value={form.organismo}
                  onChange={(e) =>
                    setForm({ ...form, organismo: e.target.value })
                  }
                  required
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px] text-foreground outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Seleccioná
                  </option>
                  {ORGANISMOS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] font-medium text-foreground">
                  Carácter
                </label>
                <div className="flex h-9 rounded-lg border border-border overflow-hidden">
                  {(["normal", "urgente"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, caracter: c })}
                      className={cn(
                        "flex-1 text-[12.5px] font-medium capitalize transition-colors duration-100",
                        form.caracter === c
                          ? c === "urgente"
                            ? "bg-amber-500 text-white"
                            : "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c === "normal" ? "Normal" : "Urgente"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-foreground">
                Archivos PDF
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-150",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadIcon
                  size={22}
                  className={cn(
                    "mx-auto mb-2 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground/60"
                  )}
                />
                <p className="text-[12.5px] text-muted-foreground">
                  {isDragging ? (
                    <span className="text-primary font-medium">
                      Soltá los archivos acá
                    </span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">
                        Arrastrá PDFs
                      </span>{" "}
                      o hacé click para seleccionar
                    </>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  La IA leerá los archivos y pre-completará los campos
                </p>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <ul className="space-y-1.5 mt-2">
                  {files.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/60 border border-border"
                    >
                      <PdfIcon size={14} className="text-red-500 shrink-0" />
                      <span className="text-[12px] text-foreground flex-1 truncate">
                        {f.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {(f.size / 1024).toFixed(0)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <XIcon size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="h-9 px-4 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="h-9 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
            >
              Crear expediente
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

function XIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function UploadIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function PdfIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
