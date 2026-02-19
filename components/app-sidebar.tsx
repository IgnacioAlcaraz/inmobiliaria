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
  if (profile?.role === 'encargado') {
    items = encargadoItems
  } else if (profile?.role === 'admin') {
    items = adminItems
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Building2 className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-heading text-lg font-bold tracking-wide text-sidebar-foreground">RE/MAX</span>
            <span className="text-xs font-medium text-sidebar-foreground/70 tracking-widest uppercase">CRM Suite</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            Menu principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu aria-label="Navegacion principal">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url || pathname.startsWith(item.url + '/')}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-sidebar-foreground/80">
            <p className="font-medium text-sidebar-primary">{profile?.full_name || 'Usuario'}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{profile?.role || 'vendedor'}</p>
          </div>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesion"
            className="flex items-center gap-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesion
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
