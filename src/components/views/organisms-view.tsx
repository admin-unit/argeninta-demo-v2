"use client";

import { DataTable } from "./data-table";
import { OrganismPreview } from "./organism-preview";
import { ViewToolbar } from "./view-toolbar";
import { ORGANISMS_SCHEMA } from "@/lib/views/schemas";
import type { OrganismRow } from "@/lib/views/data-organisms";

/**
 * Client wrapper de la vista `/organismos`. Recibe rows desde el server
 * component. La config vive en URL — DataTable y ViewToolbar la leen via
 * `useSearchParams`.
 */
export function OrganismsView({ rows }: { rows: OrganismRow[] }) {
  return (
    <>
      <ViewToolbar schema={ORGANISMS_SCHEMA} />
      <DataTable
        schema={ORGANISMS_SCHEMA}
        rows={rows as unknown as Array<Record<string, unknown> & { id: string }>}
        renderPreview={(row, close) => (
          <OrganismPreview
            row={row as unknown as OrganismRow}
            onClose={close}
          />
        )}
      />
    </>
  );
}
