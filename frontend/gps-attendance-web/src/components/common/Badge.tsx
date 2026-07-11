import type { ReactNode } from 'react'

// ─── Badge Component ──────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  dot?: boolean
}

const variantMap: Record<BadgeVariant, string> = {
  green: 'badge-green',
  red: 'badge-red',
  yellow: 'badge-yellow',
  blue: 'badge-blue',
  gray: 'badge-gray',
}

const dotColorMap: Record<BadgeVariant, string> = {
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
}

export default function Badge({ variant = 'gray', dot = false, children }: BadgeProps) {
  return (
    <span className={`badge ${variantMap[variant]}`}>
      {dot && (
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColorMap[variant]}`} />
      )}
      {children}
    </span>
  )
}
