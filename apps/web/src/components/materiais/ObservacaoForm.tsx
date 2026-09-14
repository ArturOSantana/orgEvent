import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import {
  atualizarObservacao,
  criarObservacao,
  type Observacao,
} from '../../services/materialService'

const schema = z.object({
  conteudo: z.string().min(3, 'A observacao deve ter pelo menos 3 caracteres'),
})

type FormValues = z.infer<typeof schema>

interface ObservacaoFormProps {
  eventoId: string
  observacao?: Observacao
  onSuccess: (observacao: Observacao) => void
  onCancel: () => void
}

export function ObservacaoForm({ eventoId, observacao, onSuccess, onCancel }: ObservacaoFormProps) {
  const isEdicao = Boolean(observacao)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { conteudo: observacao?.conteudo ?? '' },
  })

  useEffect(() => {
    reset({ conteudo: observacao?.conteudo ?? '' })
  }, [observacao, reset])

  async function onSubmit(values: FormValues) {
    try {
      const resultado = isEdicao
        ? await atualizarObservacao(eventoId, observacao!.id, values.conteudo)
        : await criarObservacao(eventoId, values.conteudo)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar a observacao. Tente novamente.')
    }
  }

  return (
    <Modal open onClose={onCancel} title={isEdicao ? 'Editar Observacao' : 'Nova Observacao'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="conteudo-observacao">Observacao *</label>
          <textarea
            id="conteudo-observacao"
            rows={5}
            placeholder="Digite a observacao"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            {...register('conteudo')}
          />
          {errors.conteudo && <span className="text-xs text-red-600">{errors.conteudo.message}</span>}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
