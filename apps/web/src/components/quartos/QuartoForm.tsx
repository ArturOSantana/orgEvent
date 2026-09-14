import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { criarQuarto, atualizarQuarto, type Quarto, type GeneroQuarto } from '../../services/quartoService'
import { useState } from 'react'

const quartoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(200),
  genero: z.enum(['masculino', 'feminino', 'misto']),
  capacidade: z.coerce.number().int().min(1, 'Capacidade mínima é 1').max(200),
  responsavelNome: z.string().max(200).optional(),
  localizacao: z.string().max(200).optional(),
  obs: z.string().optional(),
})

type QuartoFormData = z.infer<typeof quartoSchema>

interface QuartoFormProps {
  eventoId: string
  quarto?: Quarto
  onSuccess: (quarto: Quarto) => void
  onCancel: () => void
}

const GENERO_OPTIONS: { value: GeneroQuarto; label: string }[] = [
  { value: 'misto', label: 'Misto' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
]

export function QuartoForm({ eventoId, quarto, onSuccess, onCancel }: QuartoFormProps) {
  const [erroMsg, setErroMsg] = useState('')
  const isEdicao = Boolean(quarto)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuartoFormData>({
    resolver: zodResolver(quartoSchema) as any,
    defaultValues: quarto
      ? {
          nome: quarto.nome,
          genero: quarto.genero,
          capacidade: quarto.capacidade,
          responsavelNome: quarto.responsavelNome ?? '',
          localizacao: quarto.localizacao ?? '',
          obs: quarto.obs ?? '',
        }
      : {
          nome: '',
          genero: 'misto',
          capacidade: 4,
          responsavelNome: '',
          localizacao: '',
          obs: '',
        },
  })

  async function onSubmit(data: QuartoFormData) {
    setErroMsg('')
    try {
      let resultado: Quarto
      if (isEdicao && quarto) {
        resultado = await atualizarQuarto(eventoId, quarto.id, data)
      } else {
        resultado = await criarQuarto(eventoId, data)
      }
      onSuccess(resultado)
    } catch {
      setErroMsg('Ocorreu um erro ao salvar o quarto. Tente novamente.')
    }
  }

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title={isEdicao ? 'Editar Quarto / Acomodação' : 'Novo Quarto / Acomodação'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {erroMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
            {erroMsg}
          </p>
        )}

        <Input
          label="Nome do Quarto / Chalé *"
          placeholder="ex: Quarto 101, Chalé Alfa, Ala Feminina 02"
          error={errors.nome?.message}
          {...register('nome')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Gênero / Tipo"
            options={GENERO_OPTIONS}
            error={errors.genero?.message}
            {...register('genero')}
          />

          <Input
            label="Capacidade (Vagas) *"
            type="number"
            min={1}
            max={200}
            error={errors.capacidade?.message}
            {...register('capacidade')}
          />
        </div>

        <Input
          label="Responsável / Líder do Quarto (opcional)"
          placeholder="ex: Lucas Silva"
          error={errors.responsavelNome?.message}
          {...register('responsavelNome')}
        />

        <Input
          label="Localização / Bloco (opcional)"
          placeholder="ex: Prédio B - 2º Andar"
          error={errors.localizacao?.message}
          {...register('localizacao')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            placeholder="Informações adicionais sobre o quarto..."
            {...register('obs')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} type="button">
            Cancelar
          </Button>
          <Button variant="primary" loading={isSubmitting} type="submit">
            {isEdicao ? 'Salvar Alterações' : 'Criar Quarto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
