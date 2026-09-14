import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { criarHorario, atualizarHorario } from '../../services/cronogramaService'
import type { Fase, Horario } from '../../services/cronogramaService'

const schema = z
  .object({
    titulo: z.string().min(1, 'Título é obrigatório'),
    faseId: z.string().optional(),
    data: z.string().min(1, 'Data é obrigatória'),
    horaInicio: z
      .string()
      .min(1, 'Hora de início é obrigatória')
      .regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
    horaFim: z
      .string()
      .min(1, 'Hora de fim é obrigatória')
      .regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
    local: z.string().optional(),
    descricao: z.string().optional(),
  })
  .refine((d) => !d.horaInicio || !d.horaFim || d.horaFim > d.horaInicio, {
    message: 'Hora de fim deve ser maior que hora de início',
    path: ['horaFim'],
  })

type FormValues = z.infer<typeof schema>

interface HorarioFormProps {
  eventoId: string
  fases: Fase[]
  horario?: Horario
  onSuccess: (horario: Horario) => void
  onCancel: () => void
}

export function HorarioForm({
  eventoId,
  fases,
  horario,
  onSuccess,
  onCancel,
}: HorarioFormProps) {
  const isEdicao = Boolean(horario)

  const faseOptions = [
    { value: '', label: 'Sem fase' },
    ...fases.map((f) => ({ value: f.id, label: f.nome })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: horario
      ? {
          titulo: horario.titulo,
          faseId: horario.faseId ?? '',
          data: horario.data,
          horaInicio: horario.horaInicio,
          horaFim: horario.horaFim,
          local: horario.local ?? '',
          descricao: horario.descricao ?? '',
        }
      : {
          titulo: '',
          faseId: '',
          data: '',
          horaInicio: '',
          horaFim: '',
          local: '',
          descricao: '',
        },
  })

  useEffect(() => {
    if (horario) {
      reset({
        titulo: horario.titulo,
        faseId: horario.faseId ?? '',
        data: horario.data,
        horaInicio: horario.horaInicio,
        horaFim: horario.horaFim,
        local: horario.local ?? '',
        descricao: horario.descricao ?? '',
      })
    }
  }, [horario, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        titulo: values.titulo,
        faseId: values.faseId || undefined,
        data: values.data,
        horaInicio: values.horaInicio,
        horaFim: values.horaFim,
        local: values.local || undefined,
        descricao: values.descricao || undefined,
        ordem: horario?.ordem ?? 0,
      }
      const resultado = isEdicao
        ? await atualizarHorario(eventoId, horario!.id, payload)
        : await criarHorario(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar o horário. Tente novamente.')
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title={isEdicao ? 'Editar Horário' : 'Novo Horário'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Título *"
          placeholder="Título do horário"
          error={errors.titulo?.message}
          {...register('titulo')}
        />

        <Select
          label="Fase"
          options={faseOptions}
          error={errors.faseId?.message}
          {...register('faseId')}
        />

        <Input
          label="Data *"
          type="date"
          error={errors.data?.message}
          {...register('data')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Hora de início *"
            type="time"
            error={errors.horaInicio?.message}
            {...register('horaInicio')}
          />
          <Input
            label="Hora de fim *"
            type="time"
            error={errors.horaFim?.message}
            {...register('horaFim')}
          />
        </div>

        <Input
          label="Local"
          placeholder="Local (opcional)"
          error={errors.local?.message}
          {...register('local')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            rows={3}
            placeholder="Descrição opcional"
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
