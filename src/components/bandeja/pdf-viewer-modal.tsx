"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";
import type { InboxAttachment } from "@/lib/data";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const ThumbStrip = dynamic(() => import("./pdf-page-preview"), { ssr: false });

export function PdfViewerModal({
  attachments,
  urls,
  initialIndex,
  onClose,
}: {
  attachments: InboxAttachment[];
  urls: Record<string, string>;
  initialIndex: number;
  onClose: () => void;
}) {
  const pdfAttachments = attachments.filter(
    (a) => (a.mime_type ?? "").toLowerCase().includes("pdf") && urls[a.id],
  );

  const startIdx = Math.max(
    0,
    pdfAttachments.findIndex((a) => a.id === attachments[initialIndex]?.id),
  );

  const [idx, setIdx] = useState(Math.max(0, startIdx));
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const current = pdfAttachments[idx];

  function next() {
    setIdx((i) => Math.min(i + 1, pdfAttachments.length - 1));
    setPage(1);
  }
  function prev() {
    setIdx((i) => Math.max(0, i - 1));
    setPage(1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfAttachments.length]);

  if (!current) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex items-center justify-between gap-3 px-5 py-3 bg-zinc-900 text-zinc-100 border-b border-zinc-800"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[13px] font-medium truncate">{current.filename}</span>
          <span className="text-[11.5px] text-zinc-400 shrink-0">
            {idx + 1} de {pdfAttachments.length}
            {numPages > 0 ? ` · pág ${page}/${numPages}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="px-2 py-1 text-[12px] rounded-md hover:bg-zinc-800"
            title="Alejar"
          >
            −
          </button>
          <span className="text-[11.5px] text-zinc-400 tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="px-2 py-1 text-[12px] rounded-md hover:bg-zinc-800"
            title="Acercar"
          >
            +
          </button>
          <a
            href={urls[current.id]}
            download={current.filename}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-[12px] rounded-md hover:bg-zinc-800"
          >
            ↓ Descargar
          </a>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-[12px] rounded-md hover:bg-zinc-800"
            title="Cerrar (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-stretch min-h-0"
      >
        <button
          onClick={prev}
          disabled={idx === 0}
          className="px-3 text-zinc-300 hover:text-white hover:bg-zinc-900/40 disabled:opacity-30 disabled:cursor-not-allowed text-2xl"
          title="Anterior (←)"
        >
          ‹
        </button>
        <div
          ref={containerRef}
          className="flex-1 overflow-auto py-6 px-4 flex justify-center"
        >
          <Document
            file={urls[current.id]}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            loading={<DocLoading />}
            error={<DocError />}
          >
            <Page
              key={`${current.id}-${page}`}
              pageNumber={page}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={<DocLoading />}
              className="shadow-2xl"
            />
          </Document>
        </div>
        <button
          onClick={next}
          disabled={idx >= pdfAttachments.length - 1}
          className="px-3 text-zinc-300 hover:text-white hover:bg-zinc-900/40 disabled:opacity-30 disabled:cursor-not-allowed text-2xl"
          title="Siguiente (→)"
        >
          ›
        </button>
      </div>

      {/* Footer — paginación interna del PDF + strip de adjuntos */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border-t border-zinc-800 px-5 py-3 flex items-center gap-4"
      >
        {numPages > 1 && (
          <div className="flex items-center gap-2 text-zinc-300">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-[12px] rounded hover:bg-zinc-800 disabled:opacity-30"
            >
              ← pág
            </button>
            <span className="text-[12px] tabular-nums">
              {page} / {numPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(numPages, p + 1))}
              disabled={page >= numPages}
              className="px-2 py-1 text-[12px] rounded hover:bg-zinc-800 disabled:opacity-30"
            >
              pág →
            </button>
          </div>
        )}
        <div className="flex-1 flex gap-2 overflow-x-auto">
          {pdfAttachments.map((a, i) => (
            <button
              key={a.id}
              onClick={() => {
                setIdx(i);
                setPage(1);
              }}
              className={cn(
                "shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-colors",
                i === idx ? "border-primary" : "border-zinc-700 hover:border-zinc-500",
              )}
              title={a.filename}
            >
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <ThumbStrip url={urls[a.id]} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocLoading() {
  return <div className="text-zinc-400 text-[13px]">Cargando PDF…</div>;
}
function DocError() {
  return <div className="text-zinc-400 text-[13px]">No se pudo cargar el PDF.</div>;
}
