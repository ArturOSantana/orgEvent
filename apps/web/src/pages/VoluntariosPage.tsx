import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { PlusOutlined, CopyOutlined, LinkOutlined, UserOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useDebounce } from '../hooks/useDebounce'
import {
  listarVoluntarios,
  gerarConvite,
  removerVoluntario,
} from '../services/voluntarioService'
import type { Voluntario } from '../services/voluntarioService'
import { VoluntarioForm } from '../components/voluntarios/VoluntarioForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '../store/authStore'
import { exportarArquivo } from '../utils/exportar'

// ── Badge de status de convite ─────────────────────────────────────────────────

function BadgeConvite({ status, slug }: { status?: string | null; slug?: string | null }) {
  if (!slug) {
    return <span className="text-xs text-gray-400">—</span>
  }
  const estilos: Record<string, string> = {
    aceito: 'bg-green-50 text-green-700 border-green-200',
    recusado: 'bg-red-50 text-red-700 border-red-200',
    pendente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  }
  const labels: Record<string, string> = {
    aceito: 'Confirmado',
    recusado: 'Recusou',
    pendente: 'Pendente',
  }
  const s = status ?? 'pendente'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${estilos[s] ?? estilos.pendente}`}
    >
      {labels[s] ?? s}
    </span>
  )
}

// ── Utilitários ────────────────────────────────────────────────────────────────

function formatarData(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function urlConvite(slug: string): string {
  return `${window.location.origin}/convite/${slug}`
}

// ── Componente principal ────────────────────────────────────────────────────────

export function VoluntariosPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((s) => s.usuario)
  const podeEditar =
    usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'

  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroMsg, setErroMsg] = useState('')
  const [busca, setBusca] = useState('')
  const buscaDebounced = useDebounce(busca)

  const [modalAberto, setModalAberto] = useState(false)
  const [voluntarioEmEdicao, setVoluntarioEmEdicao] = useState<Voluntario | undefined>()

  // Geração de convite — rastreia qual ID está sendo gerado
  const [gerandoConvite, setGerandoConvite] = useState<string | null>(null)
  // Exportação
  const [exportando, setExportando] = useState<'xlsx' | 'pdf' | null>(null)
  // Toast
  const [toastMsg, setToastMsg] = useState('')

  const carregar = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErroMsg('')
    try {
      const data = await listarVoluntarios(eventoId, { busca: buscaDebounced || undefined })
      setVoluntarios(data)
    } catch {
      setErroMsg('Não foi possível carregar os voluntários. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, buscaDebounced])

  useEffect(() => {
    carregar()
  }, [carregar])

  function abrirNovoVoluntario() {
    setVoluntarioEmEdicao(undefined)
    setModalAberto(true)
  }

  function abrirEditarVoluntario(voluntario: Voluntario) {
    setVoluntarioEmEdicao(voluntario)
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setVoluntarioEmEdicao(undefined)
  }

  function handleVoluntarioSalvo(voluntario: Voluntario) {
    setVoluntarios((prev) => {
      const idx = prev.findIndex((v) => v.id === voluntario.id)
      if (idx >= 0) {
        const nova = [...prev]
        nova[idx] = voluntario
        return nova
      }
      return [...prev, voluntario]
    })
    fecharModal()
  }

  async function handleGerarConvite(voluntario: Voluntario) {
    if (!eventoId) return
    // Se já tem slug, apenas copia o link
    if (voluntario.slug) {
      copiarLink(urlConvite(voluntario.slug))
      return
    }
    setGerandoConvite(voluntario.id)
    try {
      const { slug } = await gerarConvite(eventoId, voluntario.id)
      setVoluntarios((prev) =>
        prev.map((v) =>
          v.id === voluntario.id ? { ...v, slug, statusConvite: 'pendente' } : v,
        ),
      )
      copiarLink(urlConvite(slug))
    } catch {
      mostrarToast('Erro ao gerar convite. Tente novamente.')
    } finally {
      setGerandoConvite(null)
    }
  }

  async function handleRemover(voluntario: Voluntario) {
    if (!eventoId) return
    if (!confirm(`Remover "${voluntario.nome}" permanentemente?`)) return
    try {
      await removerVoluntario(eventoId, voluntario.id)
      setVoluntarios((prev) => prev.filter((v) => v.id !== voluntario.id))
      mostrarToast('Voluntário removido.')
    } catch {
      mostrarToast('Erro ao remover voluntário.')
    }
  }

  async function exportarExcel() {
    if (!eventoId) return
    setExportando('xlsx')
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/voluntarios.xlsx`,
        'voluntarios.xlsx',
      )
    } finally {
      setExportando(null)
    }
  }

  async function exportarPDF() {
    if (!eventoId) return
    setExportando('pdf')
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/voluntarios.pdf`,
        'voluntarios.pdf',
      )
    } finally {
      setExportando(null)
    }
  }

  function copiarLink(url: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => mostrarToast('Link copiado!'))
    } else {
      prompt('Copie o link do convite:', url)
    }
  }

  function mostrarToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Voluntários</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            icon={<FileExcelOutlined />}
            onClick={exportarExcel}
            loading={exportando === 'xlsx'}
          >
            Excel
          </Button>
          <Button
            variant="ghost"
            icon={<FilePdfOutlined />}
            onClick={exportarPDF}
            loading={exportando === 'pdf'}
          >
            PDF
          </Button>
          {podeEditar && (
            <Button
              variant="primary"
              icon={<PlusOutlined />}
              onClick={abrirNovoVoluntario}
            >
              Novo Voluntário
            </Button>
          )}
        </div>
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Erro */}
      {erroMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-3">
          {erroMsg}
        </p>
      )}

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-8 h-8 text-primary-600" />
        </div>
      ) : voluntarios.length === 0 ? (
        <EmptyState
          title={busca ? 'Nenhum voluntário encontrado' : 'Nenhum voluntário cadastrado'}
          description={
            busca
              ? `Nenhum resultado para "${busca}".`
              : 'Cadastre o primeiro voluntário clicando em "Novo Voluntário".'
          }
          action={
            podeEditar && !busca ? (
              <Button
                variant="primary"
                icon={<PlusOutlined />}
                onClick={abrirNovoVoluntario}
              >
                Novo Voluntário
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-500">
            {voluntarios.length} {voluntarios.length === 1 ? 'voluntário' : 'voluntários'}
            {busca && ` encontrado${voluntarios.length === 1 ? '' : 's'} para "${busca}"`}
          </p>

          {voluntarios.map((voluntario) => (
            <div
              key={voluntario.id}
              className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 px-5 py-4 hover:border-primary-300 transition-colors"
            >
              <span className="text-lg text-gray-400 mt-0.5">
                <UserOutlined />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{voluntario.nome}</p>
                  <BadgeConvite status={voluntario.statusConvite} slug={voluntario.slug} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {voluntario.email && (
                    <p className="text-xs text-gray-500">{voluntario.email}</p>
                  )}
                  {voluntario.telefone && (
                    <p className="text-xs text-gray-500">{voluntario.telefone}</p>
                  )}
                </div>

                {/* Dados do convite */}
                {voluntario.slug && (
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                    {voluntario.observacaoConvite && (
                      <p className="text-xs text-gray-500 italic">
                        "{voluntario.observacaoConvite}"
                      </p>
                    )}
                    {voluntario.dataResposta && (
                      <p className="text-xs text-gray-400">
                        Respondeu em {formatarData(voluntario.dataResposta)}
                      </p>
                    )}
                    {!voluntario.visualizadoEm && (
                      <p className="text-xs text-gray-400">Não visualizou ainda</p>
                    )}
                    {voluntario.visualizadoEm && !voluntario.dataResposta && (
                      <p className="text-xs text-gray-400">
                        Abriu em {formatarData(voluntario.visualizadoEm)}
                      </p>
                    )}
                  </div>
                )}

                {voluntario.obs && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{voluntario.obs}</p>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 shrink-0">
                {podeEditar && (
                  <>
                    {/* Gerar / copiar link */}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={voluntario.slug ? <CopyOutlined /> : <LinkOutlined />}
                      loading={gerandoConvite === voluntario.id}
                      onClick={() => handleGerarConvite(voluntario)}
                      title={voluntario.slug ? 'Copiar link do convite' : 'Gerar convite'}
                    >
                      {voluntario.slug ? 'Copiar link' : 'Gerar convite'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEditarVoluntario(voluntario)}
                    >
                      Editar
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemover(voluntario)}
                    >
                      Remover
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal voluntário */}
      {modalAberto && eventoId && (
        <VoluntarioForm
          eventoId={eventoId}
          voluntario={voluntarioEmEdicao}
          onSuccess={handleVoluntarioSalvo}
          onCancel={fecharModal}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm rounded-lg px-4 py-3 shadow-lg animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
