import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { criarFase, atualizarFase } from '../../services/cronogramaService'
import type { Fase } from '../../services/cronogramaService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
  // Mantido como string para compatibilidade com input[type=number]
  ordem: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface FaseFormProps {
  eventoId: string
  fase?: Fase
  onSuccess: (fase: Fase) => void
  onCancel: () => void
}

export function FaseForm({ eventoId, fase, onSuccess, onCancel }: FaseFormProps) {
  const isEdicao = Boolean(fase)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: fase
      ? { nome: fase.nome, descricao: fase.descricao ?? '', ordem: String(fase.ordem) }
      : { nome: '', descricao: '', ordem: '0' },
  })

  useEffect(() => {
    if (fase) {
      reset({ nome: fase.nome, descricao: fase.descricao ?? '', ordem: String(fase.ordem) })
    }
  }, [fase, reset])

  async function onSubmit(values: FormValues) {
    try {
      const ordemNum =
        values.ordem !== undefined && values.ordem !== ''
          ? parseInt(values.ordem, 10)
          : 0

      const payload = {
        nome: values.nome,
        descricao: values.descricao || undefined,
        ordem: Number.isNaN(ordemNum) ? 0 : ordemNum,
      }
      const resultado = isEdicao
        ? await atualizarFase(eventoId, fase!.id, payload)
        : await criarFase(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar a fase. Tente novamente.')
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={isEdicao ? 'Editar Fase' : 'Nova Fase'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nome *"
          placeholder="Nome da fase"
          error={errors.nome?.message}
          {...register('nome')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descricao</label>
          <textarea
            rows={3}
            placeholder="Descricao opcional"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            {...register('descricao')}
          />
        </div>

        <Input
          label="Ordem"
          type="number"
          min={0}
          placeholder="0"
          error={errors.ordem?.message}
          {...register('ordem')}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
