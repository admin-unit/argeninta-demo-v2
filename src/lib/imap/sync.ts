/**
 * IMAP sync — descarga mails UNSEEN de la casilla compartida,
 * los persiste en `inbox_emails` + `inbox_attachments`, sube los PDFs
 * al bucket `inbox` de Storage y marca cada mail como \Seen.
 *
 * Usa node-imap (callback-based) envuelto en promesas + mailparser.
 * Corre con service_role (bypass RLS).
 */

import Imap from "imap";
import { simpleParser, type ParsedMail, type Attachment } from "mailparser";
import { createAdminClient } from "@/lib/supabase/admin";

export type SyncResult = {
  synced: number;
  skipped: number;
  errors: Array<{ uid?: number; message: string }>;
};

type ImapConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
};

function loadConfig(): ImapConfig {
  const host = process.env.INBOX_IMAP_HOST;
  const port = Number(process.env.INBOX_IMAP_PORT ?? 993);
  const user = process.env.INBOX_IMAP_USER;
  const password = process.env.INBOX_IMAP_PASSWORD;
  const tls = (process.env.INBOX_IMAP_TLS ?? "true").toLowerCase() === "true";
  if (!host || !user || !password) {
    throw new Error("Faltan vars: INBOX_IMAP_HOST, INBOX_IMAP_USER, INBOX_IMAP_PASSWORD");
  }
  return { host, port, user, password, tls };
}

function openImap(cfg: ImapConfig): Promise<Imap> {
  return new Promise((resolve, reject) => {
    const client = new Imap({
      user: cfg.user,
      password: cfg.password,
      host: cfg.host,
      port: cfg.port,
      tls: cfg.tls,
      tlsOptions: { rejectUnauthorized: true },
      authTimeout: 15000,
    });
    client.once("ready", () => resolve(client));
    client.once("error", (err: Error) => reject(err));
    client.connect();
  });
}

function openBox(imap: Imap, name: string): Promise<Imap.Box> {
  return new Promise((resolve, reject) => {
    imap.openBox(name, false, (err, box) => (err ? reject(err) : resolve(box)));
  });
}

function search(imap: Imap, criteria: unknown[]): Promise<number[]> {
  return new Promise((resolve, reject) => {
    imap.search(criteria, (err, uids) => (err ? reject(err) : resolve(uids ?? [])));
  });
}

function fetchOne(imap: Imap, uid: number): Promise<{ uid: number; raw: Buffer }> {
  return new Promise((resolve, reject) => {
    const f = imap.fetch([uid], { bodies: "", struct: false, markSeen: false });
    const chunks: Buffer[] = [];
    f.on("message", (msg) => {
      msg.on("body", (stream) => {
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      });
    });
    f.once("error", reject);
    f.once("end", () => resolve({ uid, raw: Buffer.concat(chunks) }));
  });
}

function addFlag(imap: Imap, uid: number, flag: string): Promise<void> {
  return new Promise((resolve, reject) => {
    imap.addFlags([uid], flag, (err) => (err ? reject(err) : resolve()));
  });
}

const MESA_DE_ENTRADA_NAME = "Mesa de Entrada";

function extractEmail(addr: ParsedMail["from"]): { name: string | null; email: string } {
  if (!addr || !addr.value || addr.value.length === 0) {
    return { name: null, email: "unknown@unknown" };
  }
  const first = addr.value[0];
  return { name: first.name || null, email: first.address || "unknown@unknown" };
}

function addressList(addr: ParsedMail["to"] | ParsedMail["cc"]): string[] {
  if (!addr) return [];
  const list = Array.isArray(addr) ? addr : [addr];
  const out: string[] = [];
  for (const item of list) {
    for (const v of item.value ?? []) {
      if (v.address) out.push(v.address);
    }
  }
  return out;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 200) || "adjunto";
}

export async function syncImapInbox(): Promise<SyncResult> {
  const cfg = loadConfig();
  const supabase = createAdminClient();

  // Resolver area "Mesa de Entrada"
  const { data: mesa } = await supabase
    .from("internal_areas")
    .select("id")
    .eq("name", MESA_DE_ENTRADA_NAME)
    .maybeSingle();
  const mesaId = mesa?.id ?? null;

  const result: SyncResult = { synced: 0, skipped: 0, errors: [] };
  const imap = await openImap(cfg);

  try {
    await openBox(imap, "INBOX");
    const uids = await search(imap, ["UNSEEN"]);

    for (const uid of uids) {
      try {
        const { raw } = await fetchOne(imap, uid);
        const parsed = await simpleParser(raw);

        const messageId = parsed.messageId ?? null;
        if (messageId) {
          const { data: existing } = await supabase
            .from("inbox_emails")
            .select("id")
            .eq("imap_message_id", messageId)
            .maybeSingle();
          if (existing) {
            await addFlag(imap, uid, "\\Seen");
            result.skipped += 1;
            continue;
          }
        }

        const from = extractEmail(parsed.from);
        const subject = parsed.subject?.trim() || "(sin asunto)";
        const receivedAt = (parsed.date ?? new Date()).toISOString();
        const to = addressList(parsed.to);
        const cc = addressList(parsed.cc);

        const { data: inserted, error: insertErr } = await supabase
          .from("inbox_emails")
          .insert({
            imap_message_id: messageId,
            imap_uid: uid,
            imap_mailbox: "INBOX",
            from_name: from.name,
            from_email: from.email,
            to_emails: to,
            cc_emails: cc,
            subject,
            body_text: parsed.text ?? null,
            body_html: typeof parsed.html === "string" ? parsed.html : null,
            received_at: receivedAt,
            current_area_id: mesaId,
            status: "unprocessed",
            source: "imap",
          })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          throw new Error(`insert inbox_emails: ${insertErr?.message ?? "no data"}`);
        }
        const emailId = inserted.id as string;

        // Subir attachments (solo PDFs y archivos comunes — todo lo que tenga content)
        const attachments = (parsed.attachments ?? []).filter(
          (a: Attachment) => a.content && a.content.length > 0,
        );
        for (const att of attachments) {
          const filename = sanitizeFilename(att.filename ?? "adjunto");
          const storagePath = `${emailId}/${filename}`;
          const { error: upErr } = await supabase.storage
            .from("inbox")
            .upload(storagePath, att.content, {
              contentType: att.contentType || "application/octet-stream",
              upsert: false,
            });
          if (upErr) {
            result.errors.push({ uid, message: `storage upload ${filename}: ${upErr.message}` });
            continue;
          }
          const { error: attErr } = await supabase.from("inbox_attachments").insert({
            email_id: emailId,
            filename,
            mime_type: att.contentType || null,
            size_bytes: att.size ?? att.content.length,
            storage_path: storagePath,
            page_count: null,
          });
          if (attErr) {
            result.errors.push({ uid, message: `insert inbox_attachments ${filename}: ${attErr.message}` });
          }
        }

        // Audit log: mail_received
        await supabase.from("audit_log").insert({
          inbox_email_id: emailId,
          area_id: mesaId,
          event_type: "mail_received",
          description: `Mail recibido de ${from.email}`,
          metadata: {
            from_email: from.email,
            from_name: from.name,
            subject,
            attachments: attachments.length,
          },
        });

        await addFlag(imap, uid, "\\Seen");
        result.synced += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        result.errors.push({ uid, message });
      }
    }
  } finally {
    imap.end();
  }

  return result;
}
