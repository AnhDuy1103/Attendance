import { TrendingUp } from 'lucide-react'
import type { ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────
export interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: ReactNode
  accentColor: string        // e.g. '#1e40af'
  bgColor: string            // e.g. '#eff6ff'
  growth?: string            // e.g. '+2.4%'
  progress?: number          // 0-100
  progressColor?: string     // e.g. '#16a34a'
}

// ─── StatCard Component ───────────────────────────────────────
export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  bgColor,
  growth,
  progress,
  progressColor = '#16a34a',
}: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 cursor-default group"
      style={{
        background: '#ffffff',
        border: '1px solid #e8eaf4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: bgColor, color: accentColor }}
        >
          {icon}
        </div>

        {/* Growth badge */}
        {growth && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#dcfce7', color: '#16a34a' }}
          >
            <TrendingUp size={11} />
            {growth}
          </span>
        )}
      </div>

      {/* Value */}
      <p
        className="text-3xl font-extrabold leading-none mt-3 mb-1"
        style={{ color: '#0b1c30' }}
      >
        {value}
      </p>

      {/* Title */}
      <p className="text-sm font-medium" style={{ color: '#444653' }}>
        {title}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: '#9da3b4' }}>
          {subtitle}
        </p>
      )}

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-3">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: '#f1f5f9' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: progressColor }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
