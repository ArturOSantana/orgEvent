import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'

interface BotaoVoltarProps {
  para?: string
  label?: string
}

export function BotaoVoltar({ para, label = 'Voltar' }: BotaoVoltarProps) {
  const navigate = useNavigate()

  function handleClick() {
    if (para) {
      navigate(para)
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 text-sm text-[#57606a] hover:text-[#1e3a5f] transition-colors mb-4"
    >
      <ArrowLeftOutlined style={{ fontSize: 13 }} />
      <span>{label}</span>
    </button>
  )
}
