import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'primary' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({
  open, title, message, confirmText = 'Xác nhận', cancelText = 'Đóng',
  tone = 'primary', loading = false, onConfirm, onClose,
}: ConfirmModalProps) {
  if (!open) return null
  const danger = tone === 'danger'
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
            {danger ? <AlertTriangle size={21} /> : <CheckCircle2 size={21} />}
          </span>
          <div className="min-w-0 flex-1"><h2 className="text-base font-bold text-gray-900">{title}</h2><p className="mt-1 text-sm leading-6 text-gray-600">{message}</p></div>
          <button type="button" aria-label="Đóng" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4">
          <button type="button" onClick={onClose} disabled={loading} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">{cancelText}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-700 hover:bg-blue-800'}`}>{loading ? 'Đang xử lý…' : confirmText}</button>
        </div>
      </div>
    </div>
  )
}
