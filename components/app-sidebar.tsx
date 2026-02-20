'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  Handshake,
  Building,
  CalendarCheck,
  Target,
  ShieldCheck,
  LogOut,
  Building2,
  MessageCircle,
  Users,
  Contact,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { cn } from '@/lib/utils'

const vendedorItems = [
  { title: 'Dashboard', url: '/app/dashboard', icon: LayoutDashboard },
  { title: 'Cierres', url: '/app/cierres', icon: Handshake },
  { title: 'Captaciones y Busquedas', url: '/app/captaciones', icon: Building },
  { title: 'Trackeo', url: '/app/trackeo', icon: CalendarCheck },
  { title: 'Objetivos', url: '/app/objetivos', icon: Target },
  { title: 'Contactos', url: '/app/contactos', icon: Contact },
  { title: 'Chat IA', url: '/app/chat', icon: MessageCircle },
]

const encargadoItems = [
  { title: 'Dashboard', url: '/app/manager/dashboard', icon: LayoutDashboard },
  { title: 'Vendedores', url: '/app/manager/vendedores', icon: Users },
  { title: 'Chat IA', url: '/app/manager/chat', icon: MessageCircle },
]

const adminItems = [
  { title: 'Administracion', url: '/app/admin', icon: ShieldCheck },
]

const roleConfig: Record<string, { label: string; className: string }> = {
  vendedor: {
    label: 'Vendedor',
    className: 'bg-sidebar-primary/20 text-sidebar-primary',
  },
  encargado: {
    label: 'Encargado',
    className: 'bg-sky-500/20 text-sky-300',
  },
  admin: {
    label: 'Admin',
    className: 'bg-amber-500/20 text-amber-300',
  },
}

function getInitials(name: string | null): string {
  if (!name) return 'U'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

interface AppSidebarProps {
  profile: Profile | null
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  let items = vendedorItems
  if (profile?.role === 'encargado') items = encargadoItems
  else if (profile?.role === 'admin') items = adminItems

  const initials = getInitials(profile?.full_name ?? null)
  const role = profile?.role ?? 'vendedor'
  const { label: roleLabel, className: roleClassName } = roleConfig[role] ?? roleConfig.vendedor

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-heading text-lg font-bold tracking-wide text-sidebar-foreground">
              Test
            </span>
            <span className="text-[10px] font-semibold text-sidebar-foreground/60 tracking-widest uppercase">
              CRM Suite
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold tracking-widest uppercase text-sidebar-foreground/40 px-3">
            Menu principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu aria-label="Navegacion principal">
              {items.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(item.url + '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="relative"
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        {/* Active indicator bar */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sidebar-primary rounded-r-full"
                            aria-hidden="true"
                          />
                        )}
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-150',
                            isActive && 'scale-110'
                          )}
                          aria-hidden="true"
                        />
                        <span className={cn(isActive && 'font-semibold')}>
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — user profile */}
      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/50 transition-colors duration-150">
          {/* Avatar with initials */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/30 text-sidebar-primary-foreground text-sm font-bold font-heading select-none"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">
              {profile?.full_name || 'Usuario'}
            </p>
            <span
              className={cn(
                'inline-flex w-fit items-center rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide leading-none',
                roleClassName
              )}
            >
              {roleLabel}
            </span>
          </div>

          <button
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
            className="shrink-0 p-1.5 rounded-md text-sidebar-foreground/40 hover:text-sidebar-primary hover:bg-sidebar-primary/10 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-sidebar-ring cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
