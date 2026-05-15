import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  getCurrentProfileWithContext,
  getConveniosForOrganism,
} from "@/lib/data";
import { NuevaSolicitudExternaForm } from "@/components/organismos/nueva-solicitud-externa-form";

export const dynamic = "force-dynamic";

export default async function NuevaSolicitudExterna() {
  const ctx = await getCurrentProfileWithContext();
  if (!ctx.profile) redirect("/login");

  const org = ctx.primary_organism;
  if (!org) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Nueva solicitud
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta no está asignada a un organismo todavía. Pedile a un admin
          que te agregue.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const [convenios, { data: tipos }] = await Promise.all([
    getConveniosForOrganism(org.id),
    supabase
      .from("tipos_gestion")
      .select("id, slug, name, description")
      .eq("active", true)
      .order("sort_order"),
  ]);

  const tipoOptions = (tipos ?? []).map((t) => ({
    slug: t.slug as string,
    name: t.name as string,
    description: t.description as string | null,
  }));

  const convenioOptions = convenios.map((c) => ({
    odoo_id: c.odoo_analytic_account_id as number,
    code: c.code as string | null,
    name: (c.display_alias as string | null) ?? (c.name as string | null) ?? "",
    fuente: c.fuente_financiamiento as string | null,
  }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link
        href="/mi-organismo/solicitudes"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Volver a mis solicitudes
      </Link>

      <header className="mb-6">
        <p className="text-[11px] text-muted-foreground mb-1">
          Organismo: <strong>{org.short_name ?? org.name}</strong>
        </p>
        <h1 className="text-2xl font-semibold text-foreground leading-tight">
          Nueva solicitud
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Argeninta recibe tu solicitud, la deriva al área que corresponda y la
          procesa.
        </p>
      </header>

      <NuevaSolicitudExternaForm
        tipos={tipoOptions}
        convenios={convenioOptions}
      />
    </div>
  );
}
