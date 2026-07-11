import type { ReactNode } from 'react'

// ─── Card Component ───────────────────────────────────────────

interface CardProps {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export default function Card({ title, subtitle, children, className = '', action }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
