import { OrganismsView } from "@/components/views/organisms-view";
import { getOrganismRows } from "@/lib/views/data-organisms";

export const dynamic = "force-dynamic";

export default async function Organismos() {
  const rows = await getOrganismRows();

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-foreground">Organismos</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {rows.length} organismos registrados
        </p>
      </div>

      <OrganismsView rows={rows} />
    </div>
  );
}
