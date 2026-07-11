import { Users, UserCheck, Clock } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
interface SummaryCard {
  title: string
  value: number
  icon: React.ReactNode
  accentColor: string
  bgColor: string
}

const SUMMARY_CARDS: SummaryCard[] = [
  {
    title: 'Tổng nhân viên',
    value: 256,
    icon: <Users size={20} />,
    accentColor: '#1e40af',
    bgColor: '#eff6ff',
  },
  {
    title: 'Chính thức',
    value: 242,
    icon: <UserCheck size={20} />,
    accentColor: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    title: 'Thực tập / Thử việc',
    value: 14,
    icon: <Clock size={20} />,
    accentColor: '#ea580c',
    bgColor: '#ffedd5',
  },
]

// ─── EmployeeSummaryCards ─────────────────────────────────────
export default function EmployeeSummaryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
      {SUMMARY_CARDS.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl p-5 transition-all duration-200"
          style={{
            background: '#ffffff',
            border: '1px solid #e8eaf4',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement
            el.style.transform = 'translateY(0)'
            el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: card.bgColor, color: card.accentColor }}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-3xl font-extrabold leading-none" style={{ color: '#0b1c30' }}>
                {card.value}
              </p>
              <p className="text-sm mt-1" style={{ color: '#444653' }}>
                {card.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
