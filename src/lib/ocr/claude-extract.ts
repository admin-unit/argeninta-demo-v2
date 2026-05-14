/**
 * Extracción de campos de factura argentina con Claude API.
 *
 * Pipeline:
 *   PDF (bytes) → Claude (visión nativa + json_schema) → CamposFactura
 *
 * Reemplaza el flujo doctr+regex con una sola llamada al modelo. El
 * `output_config.format` json_schema garantiza que la respuesta venga
 * con el shape exacto que pide el ReviewModal.
 *
 * Modelo configurable por env (`ANTHROPIC_MODEL`); default Haiku 4.5
 * por costo + latencia. Subir a `claude-sonnet-4-6` si vemos errores.
 */

import Anthropic from "@anthropic-ai/sdk";

export interface CamposFactura {
  tipo_comprobante: string | null;
  cuit_emisor: string | null;
  razon_social_emisor: string | null;
  punto_venta: string | null;
  numero_comprobante: string | null;
  fecha_emision: string | null; // ISO YYYY-MM-DD
  importe_total: number | null;
  moneda: string | null;
  concepto: string | null;
}

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

const SYSTEM_PROMPT = `Sos un extractor de datos de facturas argentinas. Te paso el PDF de una factura/recibo/nota emitida bajo el régimen de AFIP y devolvés los campos solicitados en JSON estricto.

Reglas:
- CUIT formato "00-00000000-0" (con guiones). Si no podés determinarlo, null.
- Punto de venta: 5 dígitos con ceros a la izquierda (ej "00003").
- Número de comprobante: 8 dígitos con ceros a la izquierda (ej "00012345").
- Fecha emisión: ISO YYYY-MM-DD.
- Importe total: número en la moneda original, sin separadores de miles (ej 12345.67).
- Moneda: "ARS" o "USD".
- Tipo de comprobante: "FACTURA A" / "FACTURA B" / "FACTURA C" / "NOTA DE CRÉDITO A" / "RECIBO X" etc, en mayúsculas.
- Concepto: descripción corta del bien o servicio facturado, máximo 140 caracteres. Si hay varios ítems, resumí en una línea.
- Cualquier campo que no puedas determinar con confianza → null.
- NO inventes datos. Si el documento no es una factura, todos los campos → null.`;

const SCHEMA = {
  type: "object",
  properties: {
    tipo_comprobante: { type: ["string", "null"] },
    cuit_emisor: { type: ["string", "null"] },
    razon_social_emisor: { type: ["string", "null"] },
    punto_venta: { type: ["string", "null"] },
    numero_comprobante: { type: ["string", "null"] },
    fecha_emision: { type: ["string", "null"] },
    importe_total: { type: ["number", "null"] },
    moneda: {
      anyOf: [
        { type: "null" },
        { type: "string", enum: ["ARS", "USD"] },
      ],
    },
    concepto: { type: ["string", "null"] },
  },
  required: [
    "tipo_comprobante",
    "cuit_emisor",
    "razon_social_emisor",
    "punto_venta",
    "numero_comprobante",
    "fecha_emision",
    "importe_total",
    "moneda",
    "concepto",
  ],
  additionalProperties: false,
} as const;

export interface ClaudeExtractResult {
  campos: CamposFactura;
  elapsedSeconds: number;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

export async function extractFacturaWithClaude(
  pdfBytes: Uint8Array,
  _filename: string,
): Promise<ClaudeExtractResult> {
  const token = process.env.ANTHROPIC_API_KEY;
  if (!token) {
    throw new Error("ANTHROPIC_API_KEY no está configurada en .env.local");
  }

  // OAuth tokens (sk-ant-oat01-...) van por Authorization: Bearer.
  // API keys (sk-ant-api03-...) van por x-api-key. El SDK soporta ambos
  // — hay que configurarlo distinto según el prefijo.
  const isOAuth = token.startsWith("sk-ant-oat");
  const client = isOAuth
    ? new Anthropic({ authToken: token, apiKey: null })
    : new Anthropic({ apiKey: token });
  const base64 = Buffer.from(pdfBytes).toString("base64");

  const t0 = performance.now();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: SCHEMA,
      },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Extraé los campos de esta factura.",
          },
        ],
      },
    ],
  });
  const elapsed = (performance.now() - t0) / 1000;

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude no devolvió texto en la respuesta.");
  }

  let parsed: CamposFactura;
  try {
    parsed = JSON.parse(textBlock.text) as CamposFactura;
  } catch {
    throw new Error(
      `Respuesta de Claude no es JSON válido: ${textBlock.text.slice(0, 200)}`,
    );
  }

  return {
    campos: parsed,
    elapsedSeconds: Math.round(elapsed * 100) / 100,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: response.model,
  };
}
