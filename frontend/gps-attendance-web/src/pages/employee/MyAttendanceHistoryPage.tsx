import { History } from 'lucide-react'

// ─── My Attendance History Page ───────────────────────────────

export default function MyAttendanceHistoryPage() {
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <History size={20} className="text-primary-600" />
          <h1 className="text-lg font-bold text-gray-900">Lịch sử cá nhân</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Month filter */}
        <div className="card">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Placeholder list */}
        <div className="card">
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm flex-col gap-2">
            <History size={40} className="text-gray-200" />
            <p>Lịch sử chấm công cá nhân sẽ hiển thị ở đây</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300">Lịch sử cá nhân</p>
      </div>
    </div>
  )
}
