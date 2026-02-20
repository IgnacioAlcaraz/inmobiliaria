import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'info'
  trend?: { value: number; label?: string }
  className?: string
}

const variantStyles = {
  default: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    accentLine: 'via-primary',
  },
  primary: {
    iconBg: 'bg-primary/15',
    iconColor: 'text-primary',
    accentLine: 'via-primary',
  },
  accent: {
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent',
    accentLine: 'via-accent',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    accentLine: 'via-emerald-500',
  },
  info: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    accentLine: 'via-blue-500',
  },
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
  className,
}: KpiCardProps) {
  const styles = variantStyles[variant]
  const trendPositive = trend && trend.value > 0
  const trendNegative = trend && trend.value < 0

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5',
        'shadow-sm hover:shadow-md',
        'transition-all duration-200 ease-out hover:-translate-y-0.5',
        className
      )}
    >
      {/* Accent line on hover */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        'bg-gradient-to-r from-transparent to-transparent',
        styles.accentLine
      )} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground truncate">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground font-heading tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground font-medium leading-tight">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-semibold mt-0.5',
              trendPositive && 'text-emerald-600 dark:text-emerald-400',
              trendNegative && 'text-destructive',
              !trendPositive && !trendNegative && 'text-muted-foreground'
            )}>
              {trendPositive && '↑'}
              {trendNegative && '↓'}
              {Math.abs(trend.value)}%
              {trend.label && (
                <span className="font-normal text-muted-foreground">{trend.label}</span>
              )}
            </span>
          )}
        </div>

        <div className={cn(
          'shrink-0 flex h-11 w-11 items-center justify-center rounded-xl',
          'transition-transform duration-200 group-hover:scale-110',
          styles.iconBg
        )}>
          <Icon className={cn('h-5 w-5', styles.iconColor)} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
