"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// El worker se sirve desde /public/pdf.worker.min.mjs (copiado en postinstall)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface Props {
  url: string;
  pageNumber?: number;
}

export default function PdfPagePreview({ url, pageNumber = 1 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden flex items-center justify-center">
      {width > 0 && (
        <Document
          file={url}
          loading={<PdfLoading />}
          error={<PdfError />}
          noData={<PdfError />}
        >
          <Page
            pageNumber={pageNumber}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<PdfLoading />}
          />
        </Document>
      )}
    </div>
  );
}

function PdfLoading() {
  return (
    <div className="w-full h-full bg-muted/40 animate-pulse" />
  );
}
function PdfError() {
  return (
    <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground/60">
      No se pudo previsualizar
    </div>
  );
}
