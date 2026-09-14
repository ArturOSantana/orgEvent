import { type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { CloseOutlined } from '@ant-design/icons'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Painel */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg focus:outline-none">
          {/* Cabeçalho */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Fechar"
                >
                  <CloseOutlined />
                </button>
              </Dialog.Close>
            </div>
          )}

          {/* Corpo */}
          <div className="px-6 py-5">{children}</div>

          {/* Rodapé opcional */}
          {footer && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
