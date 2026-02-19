'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface AppHeaderProps {
  title: string
  children?: React.ReactNode
}

export function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 sticky top-0 z-50 transition-all duration-200">
      <SidebarTrigger aria-label="Abrir menu lateral" className="text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="h-6 opacity-50" />
      <h1 className="text-xl font-heading font-bold tracking-tight text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        {children}
      </div>
    </header>
  )
}
