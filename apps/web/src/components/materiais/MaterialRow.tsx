import { EditOutlined } from '@ant-design/icons'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { Material, MaterialStatus } from '../../services/materialService'

interface MaterialRowProps {
  material: Material
  onEditar: (material: Material) => void
  onAlterarStatus: (material: Material, status: MaterialStatus) => void
  podeEditar: boolean
  statusCarregando?: boolean
}

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'adquirido', label: 'Adquirido' },
  { value: 'entregue', label: 'Entregue' },
]

const STATUS_CLASSES: Record<MaterialStatus, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  adquirido: 'bg-blue-100 text-blue-800',
  entregue: 'bg-green-100 text-green-800',
}

const STATUS_LABELS: Record<MaterialStatus, string> = {
  pendente: 'Pendente',
  adquirido: 'Adquirido',
  entregue: 'Entregue',
}

export function MaterialRow({ material, onEditar, onAlterarStatus, podeEditar, statusCarregando = false }: MaterialRowProps) {
  return (
    <tr>
      <td className="px-4 py-3 text-gray-700">{material.nome}</td>
      <td className="px-4 py-3 text-gray-700">{material.quantidade} {material.unidade ?? ''}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[material.status]}`}>
          {STATUS_LABELS[material.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-700">{material.responsavel?.nome ?? '—'}</td>
      {podeEditar && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Select
              aria-label={`Alterar status de ${material.nome}`}
              options={STATUS_OPTIONS}
              value={material.status}
              onChange={(e) => onAlterarStatus(material, e.target.value as MaterialStatus)}
              disabled={statusCarregando}
              className="min-w-[130px]"
            />
            <Button variant="ghost" size="sm" icon={<EditOutlined />} onClick={() => onEditar(material)} aria-label={`Editar ${material.nome}`} />
          </div>
        </td>
      )}
    </tr>
  )
}
