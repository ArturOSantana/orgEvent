import { api } from '../services/api'

export async function exportarArquivo(url: string, nomeArquivo: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' })
  const contentType = response.headers['content-type']
  const blob = new Blob([response.data], { type: typeof contentType === 'string' ? contentType : undefined })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(href)
}
