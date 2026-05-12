const BASE_URL = process.env.DOCUMENSO_URL ?? 'https://app.documenso.com'
const API_KEY = process.env.DOCUMENSO_API_KEY ?? ''

async function documensoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Documenso ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export interface DocumensoRecipient {
  name: string
  email: string
  role: 'SIGNER' | 'VIEWER' | 'APPROVER'
}

export interface DocumensoDocument {
  id: number
  title: string
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'DECLINED'
  createdAt: string
  recipients: { name: string; email: string; status: string }[]
  signingUrl?: string
}

export interface CreateDocumentParams {
  title: string
  recipients: DocumensoRecipient[]
  /** base64-encoded PDF */
  documentData: string
  message?: string
}

export async function createDocument(params: CreateDocumentParams): Promise<DocumensoDocument> {
  return documensoFetch<DocumensoDocument>('/documents', {
    method: 'POST',
    body: JSON.stringify({
      title: params.title,
      recipients: params.recipients,
      documentData: { type: 'BYTES_64', data: params.documentData },
      emailSubject: `Firma requerida: ${params.title}`,
      emailMessage: params.message ?? 'Por favor firmá el documento adjunto.',
    }),
  })
}

export async function listDocuments(limit = 20): Promise<{ documents: DocumensoDocument[]; total: number }> {
  return documensoFetch<{ documents: DocumensoDocument[]; total: number }>(
    `/documents?perPage=${limit}&orderBy=createdAt&orderByDirection=desc`,
  )
}

export async function getDocument(id: number): Promise<DocumensoDocument> {
  return documensoFetch<DocumensoDocument>(`/documents/${id}`)
}

export async function sendDocument(id: number): Promise<void> {
  await documensoFetch(`/documents/${id}/send`, { method: 'POST' })
}
