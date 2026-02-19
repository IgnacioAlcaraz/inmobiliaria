import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
}

export function KpiCard({ title, value, subtitle, icon: Icon }: KpiCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className="p-2 rounded-full bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground font-heading tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}
