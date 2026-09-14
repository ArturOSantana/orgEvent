import type React from 'react'
import { useState, useRef } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { importarCsv } from '../../services/participanteService'
import type { CriarParticipantePayload } from '../../services/participanteService'

interface ImportarCsvModalProps {
  eventoId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface LinhaPreview {
  nome: string
  email?: string
  telefone?: string
}

interface ErroLinha {
  linha: number
  mensagem: string
}

function parseCsv(texto: string): { validos: CriarParticipantePayload[]; erros: ErroLinha[] } {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (linhas.length < 2) {
    return { validos: [], erros: [{ linha: 0, mensagem: 'Arquivo sem dados alem do cabecalho.' }] }
  }

  const cabecalho = linhas[0].split(',').map((c) => c.trim().toLowerCase().replace(/['"]/g, ''))

  const idxNome = cabecalho.findIndex((c) => c === 'nome')
  const idxEmail = cabecalho.findIndex((c) => ['email', 'e-mail'].includes(c))
  const idxTel = cabecalho.findIndex((c) => ['telefone', 'tel', 'celular'].includes(c))

  if (idxNome === -1) {
    return { validos: [], erros: [{ linha: 1, mensagem: 'Coluna "nome" nao encontrada no cabecalho.' }] }
  }

  const validos: CriarParticipantePayload[] = []
  const erros: ErroLinha[] = []

  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const nome = colunas[idxNome] ?? ''
    if (!nome) {
      erros.push({ linha: i + 1, mensagem: `Linha ${i + 1}: campo "nome" esta vazio.` })
      continue
    }
    const entrada: CriarParticipantePayload = { nome }
    if (idxEmail !== -1 && colunas[idxEmail]) {
      entrada.email = colunas[idxEmail]
    }
    if (idxTel !== -1 && colunas[idxTel]) {
      entrada.telefone = colunas[idxTel]
    }
    validos.push(entrada)
  }

  return { validos, erros }
}

export function ImportarCsvModal({ eventoId, open, onClose, onSuccess }: ImportarCsvModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<LinhaPreview[]>([])
  const [validos, setValidos] = useState<CriarParticipantePayload[]>([])
  const [erros, setErros] = useState<ErroLinha[]>([])
  const [total, setTotal] = useState(0)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [resultado, setResultado] = useState<number | null>(null)
  const [erroMsg, setErroMsg] = useState('')

  function resetEstado() {
    setPreview([])
    setValidos([])
    setErros([])
    setTotal(0)
    setNomeArquivo('')
    setResultado(null)
    setErroMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleFechar() {
    resetEstado()
    onClose()
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setNomeArquivo(arquivo.name)
    setResultado(null)
    setErroMsg('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      const texto = ev.target?.result as string
      const { validos: v, erros: err } = parseCsv(texto)
      setValidos(v)
      setErros(err)
      setTotal(v.length)
      setPreview(v.slice(0, 5))
    }
    reader.readAsText(arquivo, 'UTF-8')
  }

  async function handleImportar() {
    if (validos.length === 0) return
    setSalvando(true)
    setErroMsg('')
    try {
      const resp = await importarCsv(eventoId, validos)
      setResultado(resp.importados)
      onSuccess()
    } catch {
      setErroMsg('Ocorreu um erro ao importar os participantes. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal open={open} onClose={handleFechar} title="Importar Participantes via CSV">
      <div className="flex flex-col gap-4">
        {/* Instrucoes */}
        <p className="text-sm text-gray-500">
          Selecione um arquivo CSV com cabecalho. Colunas suportadas:{' '}
          <span className="font-medium text-gray-700">nome</span> (obrigatorio),{' '}
          <span className="font-medium text-gray-700">email</span>,{' '}
          <span className="font-medium text-gray-700">telefone</span>.
        </p>

        {/* Input de arquivo */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Arquivo CSV</label>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<UploadOutlined />}
              onClick={() => fileRef.current?.click()}
            >
              Selecionar arquivo
            </Button>
            {nomeArquivo && (
              <span className="text-sm text-gray-600 truncate max-w-[200px]">{nomeArquivo}</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleArquivo}
          />
        </div>

        {/* Erros de parse */}
        {erros.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
            <p className="text-sm font-medium text-yellow-800 mb-1">
              {erros.length} problema(s) encontrado(s):
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {erros.map((e, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  {e.mensagem}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Preview (primeiras {preview.length} de {total} linha{total !== 1 ? 's' : ''} valida{total !== 1 ? 's' : ''}):
            </p>
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="min-w-full text-xs divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Nome</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Telefone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-800">{row.nome}</td>
                      <td className="px-3 py-2 text-gray-600">{row.email ?? '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{row.telefone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado */}
        {resultado !== null && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            {resultado} participante{resultado !== 1 ? 's' : ''} importado{resultado !== 1 ? 's' : ''} com sucesso.
          </p>
        )}

        {/* Erro de API */}
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {erroMsg}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleFechar} disabled={salvando}>
            {resultado !== null ? 'Fechar' : 'Cancelar'}
          </Button>
          {resultado === null && (
            <Button
              type="button"
              variant="primary"
              loading={salvando}
              disabled={validos.length === 0}
              onClick={handleImportar}
            >
              Importar {validos.length > 0 ? `${validos.length} participante${validos.length !== 1 ? 's' : ''}` : ''}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
