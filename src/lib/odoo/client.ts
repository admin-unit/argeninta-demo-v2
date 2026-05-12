/**
 * Cliente Odoo 18 — JSON-RPC
 *
 * Probado contra la instancia DEV de Argeninta:
 *   https://argeninta-260226-29094958.dev.odoo.com
 *
 * Todas las llamadas son server-side (Server Actions / Route Handlers).
 * Nunca exponer las creds al browser.
 *
 * Ver: doc "Odoo — Acceso, exploración y notas de integración" en Outline
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password: string;
}

interface JsonRpcResponse<T = JsonValue> {
  jsonrpc: "2.0";
  id: number | null;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: { name?: string; debug?: string; message?: string; arguments?: unknown[] };
  };
}

let cachedUid: number | null = null;
let cachedConfig: OdooConfig | null = null;

function getConfig(): OdooConfig {
  const url = process.env.ODOO_URL;
  const db = process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;
  if (!url || !db || !username || !password) {
    throw new Error(
      "Odoo env vars faltantes: ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD"
    );
  }
  return { url, db, username, password };
}

async function rpcCall<T = JsonValue>(
  config: OdooConfig,
  service: "common" | "object" | "db",
  method: string,
  args: unknown[]
): Promise<T> {
  const res = await fetch(`${config.url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as JsonRpcResponse<T>;

  if (json.error) {
    const errName = json.error.data?.name || "OdooError";
    const errMsg = json.error.data?.message || json.error.message;
    throw new Error(`${errName}: ${errMsg}`);
  }

  return json.result as T;
}

/**
 * Autentica contra Odoo y cachea el uid. Lazy: solo autentica la primera vez.
 */
export async function authenticate(): Promise<number> {
  const config = getConfig();
  // Si las creds cambiaron, invalidar cache
  if (
    cachedUid !== null &&
    cachedConfig &&
    cachedConfig.url === config.url &&
    cachedConfig.username === config.username
  ) {
    return cachedUid;
  }
  const uid = await rpcCall<number | false>(config, "common", "authenticate", [
    config.db,
    config.username,
    config.password,
    {},
  ]);
  if (!uid || uid === 0) {
    throw new Error("Odoo authentication failed: revisar ODOO_USERNAME/ODOO_PASSWORD");
  }
  cachedUid = uid as number;
  cachedConfig = config;
  return uid as number;
}

/**
 * Llamada genérica a un método de un modelo (execute_kw).
 */
export async function callKw<T = JsonValue>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {}
): Promise<T> {
  const uid = await authenticate();
  const config = getConfig();
  return rpcCall<T>(config, "object", "execute_kw", [
    config.db,
    uid,
    config.password,
    model,
    method,
    args,
    kwargs,
  ]);
}

// =============================================================================
// HELPERS COMUNES
// =============================================================================

export interface OdooSearchOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
}

/**
 * search_read — el método más usado.
 */
export async function searchRead<T = Record<string, JsonValue>>(
  model: string,
  domain: unknown[][] = [],
  options: OdooSearchOptions = {}
): Promise<T[]> {
  const kwargs: Record<string, unknown> = {};
  if (options.fields) kwargs.fields = options.fields;
  if (options.limit !== undefined) kwargs.limit = options.limit;
  if (options.offset !== undefined) kwargs.offset = options.offset;
  if (options.order) kwargs.order = options.order;
  if (options.context) kwargs.context = options.context;
  return callKw<T[]>(model, "search_read", [domain], kwargs);
}

export async function searchCount(model: string, domain: unknown[][] = []): Promise<number> {
  return callKw<number>(model, "search_count", [domain]);
}

export async function read<T = Record<string, JsonValue>>(
  model: string,
  ids: number[],
  fields?: string[]
): Promise<T[]> {
  const kwargs: Record<string, unknown> = {};
  if (fields) kwargs.fields = fields;
  return callKw<T[]>(model, "read", [ids], kwargs);
}

export async function create<T = number>(
  model: string,
  values: Record<string, unknown>
): Promise<T> {
  return callKw<T>(model, "create", [values]);
}

export async function write(
  model: string,
  ids: number[],
  values: Record<string, unknown>
): Promise<boolean> {
  return callKw<boolean>(model, "write", [ids, values]);
}

export async function unlink(model: string, ids: number[]): Promise<boolean> {
  return callKw<boolean>(model, "unlink", [ids]);
}

export async function fieldsGet(
  model: string,
  attributes: string[] = ["string", "type", "required", "readonly"]
): Promise<Record<string, JsonValue>> {
  return callKw<Record<string, JsonValue>>(model, "fields_get", [], { attributes });
}

/**
 * Sube un PDF como ir.attachment vinculado a un registro.
 * El archivo va en base64 (Odoo solo acepta así).
 */
export async function uploadAttachment(params: {
  fileBuffer: Buffer | Uint8Array;
  filename: string;
  mimetype: string;
  resModel: string;
  resId: number;
}): Promise<number> {
  const base64 = Buffer.isBuffer(params.fileBuffer)
    ? params.fileBuffer.toString("base64")
    : Buffer.from(params.fileBuffer).toString("base64");

  return create<number>("ir.attachment", {
    name: params.filename,
    type: "binary",
    datas: base64,
    mimetype: params.mimetype,
    res_model: params.resModel,
    res_id: params.resId,
  });
}

/**
 * Crea un mensaje en el chatter del registro (mail.message).
 */
export async function postChatterMessage(params: {
  resModel: string;
  resId: number;
  body: string;
  subtypeXmlid?: string;
}): Promise<number> {
  return create<number>("mail.message", {
    model: params.resModel,
    res_id: params.resId,
    message_type: "comment",
    body: params.body,
    subtype_xmlid: params.subtypeXmlid || "mail.mt_note",
  });
}

/**
 * Crea una actividad asignada a un usuario.
 */
export async function createActivity(params: {
  resModel: string;
  resId: number;
  activityTypeId: number;
  userId: number;
  summary?: string;
  note?: string;
  dateDeadline?: string; // YYYY-MM-DD
}): Promise<number> {
  return create<number>("mail.activity", {
    res_model: params.resModel,
    res_id: params.resId,
    activity_type_id: params.activityTypeId,
    user_id: params.userId,
    summary: params.summary,
    note: params.note,
    date_deadline: params.dateDeadline,
  });
}

// =============================================================================
// HELPERS DE DOMINIO (Argeninta)
// =============================================================================

/**
 * Versión de Odoo (útil para health-check).
 */
export async function version(): Promise<{ server_version: string; server_serie: string }> {
  const config = getConfig();
  return rpcCall(config, "common", "version", []);
}

export function resetCache() {
  cachedUid = null;
  cachedConfig = null;
}
