import { notFound, redirect } from "next/navigation";
import {
  canAccessInbox,
  getInboxAttachments,
  getInboxEmailById,
  getInternalAreas,
  getMailAuditLog,
  getSignedUrlForInboxAttachment,
  getSolicitudesVinculadasAMail,
  getTiposGestion,
} from "@/lib/data";
import { MailDetalle } from "@/components/bandeja/mail-detalle";

export const dynamic = "force-dynamic";

export default async function MailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await canAccessInbox();
  if (!access) redirect("/dashboard");

  const { id } = await params;
  const mail = await getInboxEmailById(id);
  if (!mail) notFound();

  const [historial, attachments, areas, solicitudes, tipos] = await Promise.all([
    getMailAuditLog(id),
    getInboxAttachments(id),
    getInternalAreas(),
    getSolicitudesVinculadasAMail(id),
    getTiposGestion(),
  ]);

  // Firma URLs en paralelo (10 min)
  const urlEntries = await Promise.all(
    attachments.map(async (a) => {
      const url = await getSignedUrlForInboxAttachment(a.storage_path);
      return [a.id, url ?? ""] as const;
    }),
  );
  const urls = Object.fromEntries(urlEntries);

  const areasNorm = areas.map((a) => ({ id: a.id as string, name: a.name as string }));
  const tiposNorm = tipos.map((t) => ({
    id: t.id as string,
    slug: t.slug as string,
    name: t.name as string,
  }));

  return (
    <MailDetalle
      mail={mail}
      historial={historial}
      attachments={attachments}
      attachmentUrls={urls}
      allAreas={areasNorm}
      solicitudesVinculadas={solicitudes}
      tiposGestion={tiposNorm}
    />
  );
}
