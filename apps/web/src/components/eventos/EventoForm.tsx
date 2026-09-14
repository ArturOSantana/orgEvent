import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { criarEvento, atualizarEvento } from '../../services/eventoService'
import type { Evento, CriarEventoPayload } from '../../services/eventoService'

// Formulario trabalha com capacidade como string para compatibilidade com input[type=number]
const schema = z
  .object({
    nome: z.string().min(1, 'Nome e obrigatorio'),
    tipo: z.string().min(1, 'Tipo e obrigatorio'),
    descricao: z.string().optional(),
    dataInicio: z.string().min(1, 'Data de inicio e obrigatoria'),
    dataFim: z.string().min(1, 'Data de fim e obrigatoria'),
    local: z.string().optional(),
    capacidade: z.string().optional(),
    obs: z.string().optional(),
  })
  .refine((d) => !d.dataInicio || !d.dataFim || d.dataFim >= d.dataInicio, {
    message: 'Data de fim deve ser maior ou igual a data de inicio',
    path: ['dataFim'],
  })
  .refine(
    (d) => {
      if (!d.capacidade || d.capacidade === '') return true
      const n = Number(d.capacidade)
      return Number.isInteger(n) && n > 0
    },
    { message: 'Deve ser um numero inteiro positivo', path: ['capacidade'] },
  )

type FormValues = z.infer<typeof schema>

const TIPO_OPTIONS = [
  { value: 'Retiro', label: 'Retiro' },
  { value: 'Acampamento', label: 'Acampamento' },
  { value: 'Conferencia', label: 'Conferencia' },
  { value: 'Encontro', label: 'Encontro' },
  { value: 'Outro', label: 'Outro' },
]

function toLocalDatetimeValue(iso: string): string {
  // Converte ISO para formato aceito por input[type=datetime-local]: YYYY-MM-DDTHH:mm
  if (!iso) return ''
  return iso.slice(0, 16)
}

interface EventoFormProps {
  evento?: Evento
  onSuccess: (evento: Evento) => void
  onCancel: () => void
}

export function EventoForm({ evento, onSuccess, onCancel }: EventoFormProps) {
  const isEdicao = Boolean(evento)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: evento
      ? {
          nome: evento.nome,
          tipo: evento.tipo,
          descricao: evento.descricao ?? '',
          dataInicio: toLocalDatetimeValue(evento.dataInicio),
          dataFim: toLocalDatetimeValue(evento.dataFim),
          local: evento.local ?? '',
          capacidade: evento.capacidade != null ? String(evento.capacidade) : '',
          obs: evento.obs ?? '',
        }
      : {
          nome: '',
          tipo: '',
          descricao: '',
          dataInicio: '',
          dataFim: '',
          local: '',
          capacidade: '',
          obs: '',
        },
  })

  useEffect(() => {
    if (evento) {
      reset({
        nome: evento.nome,
        tipo: evento.tipo,
        descricao: evento.descricao ?? '',
        dataInicio: toLocalDatetimeValue(evento.dataInicio),
        dataFim: toLocalDatetimeValue(evento.dataFim),
        local: evento.local ?? '',
        capacidade: evento.capacidade != null ? String(evento.capacidade) : '',
        obs: evento.obs ?? '',
      })
    }
  }, [evento, reset])

  async function onSubmit(values: FormValues) {
    try {
      const capacidadeNum =
        values.capacidade && values.capacidade !== ''
          ? parseInt(values.capacidade, 10)
          : undefined

      const payload: CriarEventoPayload = {
        nome: values.nome,
        tipo: values.tipo,
        descricao: values.descricao || undefined,
        dataInicio: new Date(values.dataInicio).toISOString(),
        dataFim: new Date(values.dataFim).toISOString(),
        local: values.local || undefined,
        capacidade: capacidadeNum,
        obs: values.obs || undefined,
      }

      const resultado = isEdicao
        ? await atualizarEvento(evento!.id, payload)
        : await criarEvento(payload)

      onSuccess(resultado)
    } catch {
      // Erro ja tratado pelo interceptor; exibimos mensagem generica
      alert('Ocorreu um erro ao salvar o evento. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nome *"
        placeholder="Nome do evento"
        error={errors.nome?.message}
        {...register('nome')}
      />

      <Select
        label="Tipo *"
        placeholder="Selecione o tipo"
        options={TIPO_OPTIONS}
        error={errors.tipo?.message}
        {...register('tipo')}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Data de inicio *"
          type="datetime-local"
          error={errors.dataInicio?.message}
          {...register('dataInicio')}
        />
        <Input
          label="Data de fim *"
          type="datetime-local"
          error={errors.dataFim?.message}
          {...register('dataFim')}
        />
      </div>

      <Input
        label="Local"
        placeholder="Local do evento (opcional)"
        error={errors.local?.message}
        {...register('local')}
      />

      <Input
        label="Capacidade"
        type="number"
        min={1}
        placeholder="Numero maximo de participantes (opcional)"
        error={errors.capacidade?.message}
        {...register('capacidade')}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Observacoes</label>
        <textarea
          rows={3}
          placeholder="Observacoes internas (opcional)"
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
  )
}
