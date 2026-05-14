"use client";

import { useState } from "react";
import type { InboxAttachment } from "@/lib/data";
import { PdfViewerModal } from "./pdf-viewer-modal";

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(att: InboxAttachment) {
  return (att.mime_type ?? "").toLowerCase().includes("pdf");
}

export function AttachmentThumbsGrid({
  attachments,
  urls,
}: {
  attachments: InboxAttachment[];
  urls: Record<string, string>;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3.5">
        {attachments.map((att, i) => {
          const url = urls[att.id];
          return (
            <button
              key={att.id}
              onClick={() => isPdf(att) && url && setOpenIdx(i)}
              className="border border-border rounded-lg overflow-hidden bg-card text-left transition-colors hover:border-primary/60 disabled:cursor-default"
              disabled={!isPdf(att) || !url}
            >
              <div className="h-44 bg-muted/30 flex items-center justify-center relative">
                {isPdf(att) && url ? (
                  <PdfFirstPage url={url} />
                ) : (
                  <div className="text-muted-foreground/60 text-[11px] uppercase tracking-wider">
                    {att.mime_type?.split("/")[1] ?? "archivo"}
                  </div>
                )}
              </div>
              <div className="px-3 py-2.5 border-t border-border/60">
                <p className="text-[12.5px] font-medium text-foreground line-clamp-1">
                  {att.filename}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatBytes(att.size_bytes)}
                  {att.page_count ? ` · ${att.page_count} pág` : ""}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {openIdx !== null && (
        <PdfViewerModal
          attachments={attachments}
          urls={urls}
          initialIndex={openIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}

function PdfFirstPage({ url }: { url: string }) {
  // Lazy: solo carga react-pdf cuando la grilla está montada.
  // Importamos dinámicamente para no bloquear el SSR.
  return <LazyPdfPage url={url} />;
}

// Wrapper que importa react-pdf solo en cliente (next/dynamic via ssr=false)
import dynamic from "next/dynamic";
const LazyPdfPage = dynamic(() => import("./pdf-page-preview"), { ssr: false });
