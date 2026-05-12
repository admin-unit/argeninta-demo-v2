/**
 * Cliente Odoo XML-RPC
 * Odoo 18 usa XML-RPC (no JSON REST — eso es v19)
 * Todas las llamadas van server-side para evitar CORS y exponer la API key.
 *
 * Uso:
 *   const odoo = new OdooClient({ url, db, username, apiKey })
 *   await odoo.authenticate()
 *   const partners = await odoo.search('res.partner', [['is_company','=',true]])
 */

interface OdooConfig {
  url: string
  db: string
  username: string
  apiKey: string
}

interface XmlRpcCallOptions {
  service: 'common' | 'object'
  method: string
  args: unknown[]
}

async function xmlRpcCall(url: string, options: XmlRpcCallOptions): Promise<unknown> {
  const { service, method, args } = options

  const body = `<?xml version="1.0"?>
<methodCall>
  <methodName>${method}</methodName>
  <params>
    ${args.map(serializeParam).join('\n    ')}
  </params>
</methodCall>`

  const response = await fetch(`${url}/xmlrpc/2/${service}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Odoo XML-RPC error: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return parseXmlResponse(text)
}

function serializeParam(value: unknown): string {
  if (typeof value === 'string') return `<param><value><string>${escapeXml(value)}</string></value></param>`
  if (typeof value === 'number' && Number.isInteger(value)) return `<param><value><int>${value}</int></value></param>`
  if (typeof value === 'boolean') return `<param><value><boolean>${value ? 1 : 0}</boolean></value></param>`
  if (Array.isArray(value)) {
    const items = value.map(v => `<value>${serializeValue(v)}</value>`).join('')
    return `<param><value><array><data>${items}</data></array></value></param>`
  }
  return `<param><value><string>${escapeXml(String(value))}</string></value></param>`
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') return `<string>${escapeXml(value)}</string>`
  if (typeof value === 'number' && Number.isInteger(value)) return `<int>${value}</int>`
  if (typeof value === 'boolean') return `<boolean>${value ? 1 : 0}</boolean>`
  if (Array.isArray(value)) {
    const items = value.map(v => `<value>${serializeValue(v)}</value>`).join('')
    return `<array><data>${items}</data></array>`
  }
  return `<string>${escapeXml(String(value))}</string>`
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function parseXmlResponse(xml: string): unknown {
  const faultMatch = xml.match(/<fault>[\s\S]*?<\/fault>/)
  if (faultMatch) throw new Error(`Odoo fault: ${faultMatch[0]}`)
  const valueMatch = xml.match(/<methodResponse>[\s\S]*?<params>[\s\S]*?<param>[\s\S]*?<value>([\s\S]*?)<\/value>/)
  if (!valueMatch) throw new Error('Could not parse XML-RPC response')
  return extractValue(valueMatch[1].trim())
}

function extractValue(inner: string): unknown {
  if (inner.startsWith('<int>')) return parseInt(inner.replace(/<\/?int>/g, ''))
  if (inner.startsWith('<boolean>')) return inner.includes('<boolean>1</boolean>')
  if (inner.startsWith('<string>')) return inner.replace(/<\/?string>/g, '')
  if (inner.startsWith('<array>')) {
    const matches = [...inner.matchAll(/<value>([\s\S]*?)<\/value>/g)]
    return matches.map(m => extractValue(m[1].trim()))
  }
  return inner.replace(/<[^>]+>/g, '').trim()
}

export class OdooClient {
  private config: OdooConfig
  private uid: number | null = null

  constructor(config: OdooConfig) {
    this.config = config
  }

  async authenticate(): Promise<number> {
    const uid = await xmlRpcCall(this.config.url, {
      service: 'common',
      method: 'authenticate',
      args: [this.config.db, this.config.username, this.config.apiKey, {}],
    })
    if (typeof uid !== 'number' || uid === 0) {
      throw new Error('Odoo authentication failed — check credentials')
    }
    this.uid = uid
    return uid
  }

  private async callKw(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.uid) await this.authenticate()
    return xmlRpcCall(this.config.url, {
      service: 'object',
      method: 'execute_kw',
      args: [this.config.db, this.uid, this.config.apiKey, model, method, args, kwargs],
    })
  }

  async search(model: string, domain: unknown[][], fields: string[] = [], limit = 100): Promise<unknown[]> {
    const result = await this.callKw(model, 'search_read', [domain], { fields, limit })
    return result as unknown[]
  }

  async read(model: string, ids: number[], fields: string[] = []): Promise<unknown[]> {
    const result = await this.callKw(model, 'read', [ids], { fields })
    return result as unknown[]
  }

  async count(model: string, domain: unknown[][]): Promise<number> {
    const result = await this.callKw(model, 'search_count', [domain])
    return result as number
  }

  // Métodos de dominio
  async getPartners(isCompany = false) {
    return this.search('res.partner', [['is_company', '=', isCompany]], [
      'name', 'email', 'phone', 'country_id', 'vat',
    ])
  }

  async getAnalyticAccounts() {
    return this.search('account.analytic.account', [['active', '=', true]], [
      'name', 'code', 'balance', 'currency_id',
    ])
  }

  async getInvoices(state = 'posted', limit = 50) {
    return this.search('account.move', [
      ['move_type', '=', 'in_invoice'],
      ['state', '=', state],
    ], ['name', 'partner_id', 'invoice_date', 'invoice_date_due', 'amount_total', 'state'], limit)
  }

  async getSaleOrders(limit = 50) {
    return this.search('sale.order', [], [
      'name', 'partner_id', 'date_order', 'state', 'amount_total',
    ], limit)
  }

  async getProjectTasks(projectId?: number) {
    const domain: unknown[][] = projectId ? [['project_id', '=', projectId]] : []
    return this.search('project.task', domain, [
      'name', 'project_id', 'user_ids', 'date_deadline', 'stage_id', 'priority',
    ])
  }
}

// Singleton para uso en server actions / route handlers
let _client: OdooClient | null = null

export function getOdooClient(): OdooClient {
  if (!_client) {
    const url = process.env.ODOO_URL
    const db = process.env.ODOO_DB
    const username = process.env.ODOO_USERNAME
    const apiKey = process.env.ODOO_API_KEY

    if (!url || !db || !username || !apiKey) {
      throw new Error('Odoo env vars not configured: ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY')
    }

    _client = new OdooClient({ url, db, username, apiKey })
  }
  return _client
}
