import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { criarEquipe, atualizarEquipe } from '../../services/equipeService'
import type { Equipe } from '../../services/equipeService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  descricao: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface EquipeFormProps {
  eventoId: string
  equipe?: Equipe
  onSuccess: (equipe: Equipe) => void
  onCancel: () => void
}

export function EquipeForm({ eventoId, equipe, onSuccess, onCancel }: EquipeFormProps) {
  const isEdicao = Boolean(equipe)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: equipe
      ? { nome: equipe.nome, descricao: equipe.descricao ?? '' }
      : { nome: '', descricao: '' },
  })

  useEffect(() => {
    if (equipe) {
      reset({ nome: equipe.nome, descricao: equipe.descricao ?? '' })
    }
  }, [equipe, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao || undefined,
      }
      const resultado = isEdicao
        ? await atualizarEquipe(eventoId, equipe!.id, payload)
        : await criarEquipe(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar a equipe. Tente novamente.')
    }
  }

  return (
    <Modal open onClose={onCancel} title={isEdicao ? 'Editar Equipe' : 'Nova Equipe'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nome *"
          placeholder="Nome da equipe"
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
