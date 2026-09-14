import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import {
  atualizarMaterial,
  criarMaterial,
  type Material,
  type MaterialStatus,
} from '../../services/materialService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  quantidade: z.number().positive('Quantidade deve ser positiva'),
  unidade: z.string().optional(),
  status: z.enum(['pendente', 'adquirido', 'entregue']),
  obs: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'adquirido', label: 'Adquirido' },
  { value: 'entregue', label: 'Entregue' },
]

interface MaterialFormProps {
  eventoId: string
  material?: Material
  onSuccess: (material: Material) => void
  onCancel: () => void
}

export function MaterialForm({ eventoId, material, onSuccess, onCancel }: MaterialFormProps) {
  const isEdicao = Boolean(material)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: material
      ? {
          nome: material.nome,
          quantidade: material.quantidade,
          unidade: material.unidade ?? '',
          status: material.status,
          obs: material.obs ?? '',
        }
      : { nome: '', quantidade: 1, unidade: '', status: 'pendente', obs: '' },
  })

  useEffect(() => {
    if (material) {
      reset({
        nome: material.nome,
        quantidade: material.quantidade,
        unidade: material.unidade ?? '',
        status: material.status,
        obs: material.obs ?? '',
      })
    }
  }, [material, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        quantidade: values.quantidade,
        unidade: values.unidade || undefined,
        status: values.status as MaterialStatus,
        obs: values.obs || undefined,
      }
      const resultado = isEdicao
        ? await atualizarMaterial(eventoId, material!.id, payload)
        : await criarMaterial(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar o material. Tente novamente.')
    }
  }

  return (
    <Modal open onClose={onCancel} title={isEdicao ? 'Editar Material' : 'Novo Material'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nome *" placeholder="Nome do material" error={errors.nome?.message} {...register('nome')} />
        <Input
          label="Quantidade *"
          type="number"
          min="0.01"
          step="any"
          error={errors.quantidade?.message}
          {...register('quantidade', { valueAsNumber: true })}
        />
        <Input label="Unidade" placeholder="kg, unidades, metros, litros" error={errors.unidade?.message} {...register('unidade')} />
        <Select label="Status" options={STATUS_OPTIONS} error={errors.status?.message} {...register('status')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Observacoes</label>
          <textarea
            rows={3}
            placeholder="Observacoes opcionais"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            {...register('obs')}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
