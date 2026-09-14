import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BotaoVoltar } from '../components/ui/BotaoVoltar'
import { useDebounce } from '../hooks/useDebounce'
import { FileExcelOutlined, PlusOutlined } from '@ant-design/icons'
import {
  atualizarMaterial,
  listarMateriais,
  listarObservacoes,
  type Material,
  type MaterialStatus,
  type Observacao,
} from '../services/materialService'
import { exportarArquivo } from '../utils/exportar'
import { MaterialForm } from '../components/materiais/MaterialForm'
import { MaterialRow } from '../components/materiais/MaterialRow'
import { ObservacaoCard } from '../components/materiais/ObservacaoCard'
import { ObservacaoForm } from '../components/materiais/ObservacaoForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Table } from '../components/ui/Table'
import { useAuthStore } from '../store/authStore'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'adquirido', label: 'Adquirido' },
  { value: 'entregue', label: 'Entregue' },
]

export function MateriaisPage() {
  const { eventoId } = useParams<{ eventoId: string }>()
  const usuario = useAuthStore((state) => state.usuario)
  const podeEditar = usuario?.perfil === 'coordenador' || usuario?.perfil === 'lider'
  const [aba, setAba] = useState<'materiais' | 'observacoes'>('materiais')
  const [materiais, setMateriais] = useState<Material[]>([])
  const [observacoes, setObservacoes] = useState<Observacao[]>([])
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const buscaDebounced = useDebounce(busca)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [exportando, setExportando] = useState(false)
  const [materialEditando, setMaterialEditando] = useState<Material>()
  const [observacaoEditando, setObservacaoEditando] = useState<Observacao>()
  const [formMaterialAberto, setFormMaterialAberto] = useState(false)
  const [formObservacaoAberto, setFormObservacaoAberto] = useState(false)
  const [statusCarregando, setStatusCarregando] = useState<string | null>(null)

  const carregarMateriais = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErro('')
    try {
      const resposta = await listarMateriais(eventoId, {
        busca: buscaDebounced || undefined,
        status: filtroStatus || undefined,
      })
      setMateriais(resposta.data)
    } catch {
      setErro('Não foi possível carregar os materiais. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId, buscaDebounced, filtroStatus])

  const carregarObservacoes = useCallback(async () => {
    if (!eventoId) return
    setCarregando(true)
    setErro('')
    try {
      const resposta = await listarObservacoes(eventoId)
      setObservacoes([...resposta].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()))
    } catch {
      setErro('Não foi possível carregar as observações. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [eventoId])

  useEffect(() => {
    if (aba === 'materiais') void carregarMateriais()
    else void carregarObservacoes()
  }, [aba, carregarMateriais, carregarObservacoes])

  async function exportarExcel() {
    if (!eventoId) return
    setExportando(true)
    try {
      await exportarArquivo(
        `/api/eventos/${eventoId}/exportar/materiais.xlsx`,
        'materiais.xlsx',
      )
    } finally {
      setExportando(false)
    }
  }

  async function alterarStatus(material: Material, status: MaterialStatus) {
    if (!eventoId || status === material.status) return
    setStatusCarregando(material.id)
    try {
      const atualizado = await atualizarMaterial(eventoId, material.id, { status })
      setMateriais((prev) => prev.map((item) => item.id === atualizado.id ? atualizado : item))
    } catch {
      setErro('Não foi possível atualizar o status do material.')
    } finally {
      setStatusCarregando(null)
    }
  }

  function salvarMaterial(material: Material) {
    setMateriais((prev) => {
      const index = prev.findIndex((item) => item.id === material.id)
      if (index < 0) return [material, ...prev]
      const novaLista = [...prev]
      novaLista[index] = material
      return novaLista
    })
    setFormMaterialAberto(false)
    setMaterialEditando(undefined)
  }

  function salvarObservacao(observacao: Observacao) {
    setObservacoes((prev) => {
      const index = prev.findIndex((item) => item.id === observacao.id)
      if (index < 0) return [observacao, ...prev]
      const novaLista = [...prev]
      novaLista[index] = observacao
      return novaLista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    })
    setFormObservacaoAberto(false)
    setObservacaoEditando(undefined)
  }

  const columns = [
    { key: 'nome', header: 'Nome' },
    { key: 'quantidade', header: 'Quantidade' },
    { key: 'status', header: 'Status' },
    { key: 'responsavel', header: 'Responsavel' },
    ...(podeEditar ? [{ key: 'acoes', header: 'Acoes' }] : []),
  ]

  return (
    <div className="flex flex-col gap-6 pb-20">
      <BotaoVoltar para={`/eventos/${eventoId}`} label="Voltar ao evento" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900">Materiais e Observações</h1>
        <div className="flex gap-2">
          <button className={`border-b-2 px-4 py-2 text-sm font-medium ${aba === 'materiais' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500'}`} onClick={() => setAba('materiais')}>Materiais</button>
          <button className={`border-b-2 px-4 py-2 text-sm font-medium ${aba === 'observacoes' ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500'}`} onClick={() => setAba('observacoes')}>Observações</button>
        </div>
      </div>

      {erro && <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</p>}

      {aba === 'materiais' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Input placeholder="Buscar por nome..." value={busca} onChange={(event) => setBusca(event.target.value)} />
              <Select options={STATUS_OPTIONS} value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" icon={<FileExcelOutlined />} onClick={exportarExcel} loading={exportando}>Exportar Excel</Button>
              {podeEditar && <Button variant="primary" icon={<PlusOutlined />} onClick={() => { setMaterialEditando(undefined); setFormMaterialAberto(true) }}>Novo Material</Button>}
            </div>
          </div>
          {carregando ? <div className="flex justify-center py-12"><Spinner /></div> : materiais.length === 0 ? <EmptyState title="Nenhum material cadastrado" /> : (
            <Table
              columns={columns}
              data={materiais.map((material) => ({
                material,
                nome: material.nome,
                quantidade: `${material.quantidade} ${material.unidade ?? ''}`,
                status: material.status,
                responsavel: material.responsavel?.nome ?? '—',
                acoes: '',
              }))}
              renderRow={(row, rowIdx) => (
                <MaterialRow
                  key={row.material.id}
                  material={row.material}
                  onEditar={(item) => { setMaterialEditando(item); setFormMaterialAberto(true) }}
                  onAlterarStatus={alterarStatus}
                  podeEditar={podeEditar}
                  statusCarregando={statusCarregando === row.material.id}
                />
              )}
            />
          )}
          {formMaterialAberto && eventoId && <MaterialForm eventoId={eventoId} material={materialEditando} onSuccess={salvarMaterial} onCancel={() => setFormMaterialAberto(false)} />}
        </>
      ) : (
        <>
          <div className="flex justify-end">{podeEditar && (<Button variant="primary" icon={<PlusOutlined />} onClick={() => { setObservacaoEditando(undefined); setFormObservacaoAberto(true) }}>Nova Observação</Button>)}</div>
          {carregando ? <div className="flex justify-center py-12"><Spinner /></div> : observacoes.length === 0 ? <EmptyState title="Nenhuma observacao registrada" /> : <div className="flex flex-col gap-3">{observacoes.map((observacao) => <ObservacaoCard key={observacao.id} observacao={observacao} onEditar={(item) => { setObservacaoEditando(item); setFormObservacaoAberto(true) }} podeEditar={podeEditar} />)}</div>}
          {formObservacaoAberto && eventoId && <ObservacaoForm eventoId={eventoId} observacao={observacaoEditando} onSuccess={salvarObservacao} onCancel={() => setFormObservacaoAberto(false)} />}
        </>
      )}
    </div>
  )
}
