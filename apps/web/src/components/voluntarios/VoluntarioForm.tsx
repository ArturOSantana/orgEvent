import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { criarVoluntario, atualizarVoluntario } from '../../services/voluntarioService'
import { listarEquipes, listarFuncoes } from '../../services/equipeService'
import type { Voluntario } from '../../services/voluntarioService'
import type { Equipe, Funcao } from '../../services/equipeService'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  obs: z.string().optional(),
  equipeId: z.string().optional(),
  funcaoId: z.string().optional(),
  tituloConvite: z.string().optional(),
  mensagemConvite: z.string().optional(),
  arteUrl: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface VoluntarioFormProps {
  eventoId: string
  voluntario?: Voluntario
  onSuccess: (voluntario: Voluntario) => void
  onCancel: () => void
}

export function VoluntarioForm({
  eventoId,
  voluntario,
  onSuccess,
  onCancel,
}: VoluntarioFormProps) {
  const isEdicao = Boolean(voluntario)

  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [funcoes, setFuncoes] = useState<Funcao[]>([])

  useEffect(() => {
    listarEquipes(eventoId).then(setEquipes).catch(() => {})
    listarFuncoes(eventoId).then(setFuncoes).catch(() => {})
  }, [eventoId])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: voluntario
      ? {
          nome: voluntario.nome,
          email: voluntario.email ?? '',
          telefone: voluntario.telefone ?? '',
          obs: voluntario.obs ?? '',
          equipeId: voluntario.equipeId ?? '',
          funcaoId: voluntario.funcaoId ?? '',
          tituloConvite: voluntario.tituloConvite ?? '',
          mensagemConvite: voluntario.mensagemConvite ?? '',
          arteUrl: voluntario.arteUrl ?? '',
        }
      : {
          nome: '',
          email: '',
          telefone: '',
          obs: '',
          equipeId: '',
          funcaoId: '',
          tituloConvite: '',
          mensagemConvite: '',
          arteUrl: '',
        },
  })

  useEffect(() => {
    if (voluntario) {
      reset({
        nome: voluntario.nome,
        email: voluntario.email ?? '',
        telefone: voluntario.telefone ?? '',
        obs: voluntario.obs ?? '',
        equipeId: voluntario.equipeId ?? '',
        funcaoId: voluntario.funcaoId ?? '',
        tituloConvite: voluntario.tituloConvite ?? '',
        mensagemConvite: voluntario.mensagemConvite ?? '',
        arteUrl: voluntario.arteUrl ?? '',
      })
    }
  }, [voluntario, reset])

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        nome: values.nome,
        email: values.email || undefined,
        telefone: values.telefone || undefined,
        obs: values.obs || undefined,
        equipeId: values.equipeId || null,
        funcaoId: values.funcaoId || null,
        tituloConvite: values.tituloConvite || null,
        mensagemConvite: values.mensagemConvite || null,
        arteUrl: values.arteUrl || null,
      }
      const resultado = isEdicao
        ? await atualizarVoluntario(eventoId, voluntario!.id, payload)
        : await criarVoluntario(eventoId, payload)
      onSuccess(resultado)
    } catch {
      alert('Ocorreu um erro ao salvar o voluntário. Tente novamente.')
    }
  }

  const opcoesEquipe = [
    { value: '', label: 'Nenhuma equipe' },
    ...equipes.map((e) => ({ value: e.id, label: e.nome })),
  ]

  const opcoesFuncao = [
    { value: '', label: 'Nenhuma função' },
    ...funcoes.map((f) => ({ value: f.id, label: f.nome })),
  ]

  return (
    <Modal open onClose={onCancel} title={isEdicao ? 'Editar Voluntário' : 'Novo Voluntário'}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto px-1">
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-800 border-b pb-1">Dados Gerais</h3>
          
          <Input
            label="Nome *"
            placeholder="Nome completo"
            error={errors.nome?.message}
            {...register('nome')}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="email@exemplo.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              {...register('telefone')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Possível Equipe"
              options={opcoesEquipe}
              error={errors.equipeId?.message}
              {...register('equipeId')}
            />

            <Select
              label="Função"
              options={opcoesFuncao}
              error={errors.funcaoId?.message}
              {...register('funcaoId')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <textarea
              rows={2}
              placeholder="Observações de uso interno para coordenação"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
              {...register('obs')}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <h3 className="text-sm font-bold text-gray-800 border-b pb-1">Visual e Mensagem do Convite</h3>
          
          <Input
            label="Título do Convite"
            placeholder="Ex: Você está sendo convidado(a) a servir"
            error={errors.tituloConvite?.message}
            {...register('tituloConvite')}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Mensagem / Versículo do Convite</label>
            <textarea
              rows={2}
              placeholder='Ex: "Faça-se em mim segundo a Tua Palavra." — Lc 1,38'
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
              {...register('mensagemConvite')}
            />
          </div>

          <Input
            label="URL da Arte do Convite (Imagem)"
            placeholder="Ex: /arteRetiroJovens.jpeg ou link de imagem externa"
            error={errors.arteUrl?.message}
            {...register('arteUrl')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-2">
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
