import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { criarParticipante, atualizarParticipante } from '../../services/participanteService'
import type { Participante } from '../../services/participanteService'

const schema = z.object({
  nome: z.string().min(1, 'Nome e obrigatorio'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), { message: 'Email invalido' }),
  telefone: z.string().optional(),
  status: z.enum(['confirmado', 'pendente', 'cancelado']),
  obs: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const STATUS_OPTIONS = [
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'cancelado', label: 'Cancelado' },
]

interface ParticipanteFormProps {
  eventoId: string
  participante?: Participante
  onSuccess: (participante: Participante) => void
  onCancel: () => void
}

export function ParticipanteForm({
  eventoId,
  participante,
  onSuccess,
  onCancel,
}: ParticipanteFormProps) {
  const isEdicao = Boolean(participante)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: participante
      ? {
          nome: participante.nome,
          email: participante.email ?? '',
          telefone: participante.telefone ?? '',
          status: participante.status,
          obs: participante.obs ?? '',
        }
      : { nome: '', email: '', telefone: '', status: 'confirmado', obs: '' },
  })

  useEffect(() => {
    if (participante) {
      reset({
        nome: participante.nome,
        email: participante.email ?? '',
        telefone: participante.telefone ?? '',
        status: participante.status,
        obs: participante.obs ?? '',
      })
    }
  }, [participante, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        email: values.email || undefined,
        telefone: values.telefone || undefined,
        status: values.status,
        obs: values.obs || undefined,
      }
      const resultado = isEdicao
        ? await atualizarParticipante(eventoId, participante!.id, payload)
        : await criarParticipante(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar o participante. Tente novamente.')
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={isEdicao ? 'Editar Participante' : 'Novo Participante'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Nome *"
          placeholder="Nome completo"
          error={errors.nome?.message}
          {...register('nome')}
        />

        <Input
          label="Email"
          type="text"
          placeholder="email@exemplo.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Telefone"
          placeholder="(00) 00000-0000"
          error={errors.telefone?.message}
          {...register('telefone')}
        />

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />

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
