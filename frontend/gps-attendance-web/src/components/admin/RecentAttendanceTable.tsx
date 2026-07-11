// ─── Types ────────────────────────────────────────────────────
export interface RecentAttendance {
  id: string
  employeeName: string
  employeeCode: string
  initials: string
  avatarColor: string
  time: string
  timeNote: string
  department: string
  status: 'Đúng giờ' | 'Đi trễ' | 'Quên check-out'
}

// ─── Badge config ──────────────────────────────────────────────
const STATUS_CONFIG: Record<
  RecentAttendance['status'],
  { label: string; dot: string; bg: string; text: string }
> = {
  'Đúng giờ':       { label: 'Đúng giờ',       dot: '#16a34a', bg: '#dcfce7', text: '#15803d' },
  'Đi trễ':         { label: 'Đi trễ',         dot: '#ea580c', bg: '#ffedd5', text: '#c2410c' },
  'Quên check-out': { label: 'Quên check-out', dot: '#7c3aed', bg: '#ede9fe', text: '#6d28d9' },
}

// ─── Props ─────────────────────────────────────────────────────
interface Props {
  data: RecentAttendance[]
}

// ─── RecentAttendanceTable ─────────────────────────────────────
export default function RecentAttendanceTable({ data }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr style={{ background: '#f8f9ff', borderBottom: '1px solid #e8eaf4' }}>
            {['Nhân viên', 'Thời gian', 'Phòng ban', 'Trạng thái'].map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                style={{ color: '#9da3b4' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, idx) => {
            const cfg = STATUS_CONFIG[row.status]
            return (
              <tr
                key={row.id}
                className="transition-colors duration-100 cursor-default"
                style={{
                  borderBottom: idx < data.length - 1 ? '1px solid #f1f3f9' : 'none',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = '#f0f5ff' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}
              >
                {/* Nhân viên */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: row.avatarColor }}
                    >
                      {row.initials}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#0b1c30' }}>
                        {row.employeeName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#9da3b4' }}>
                        {row.employeeCode}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Thời gian */}
                <td className="px-4 py-3.5">
                  <p className="font-medium" style={{ color: '#0b1c30' }}>
                    {row.time}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#9da3b4' }}>
                    {row.timeNote}
                  </p>
                </td>

                {/* Phòng ban */}
                <td className="px-4 py-3.5">
                  <span className="text-sm" style={{ color: '#444653' }}>
                    {row.department}
                  </span>
                </td>

                {/* Trạng thái */}
                <td className="px-4 py-3.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: cfg.bg, color: cfg.text }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: cfg.dot }}
                    />
                    {cfg.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
