import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/queries'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const profile = await getCurrentProfile()

  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Role-based routing (middleware no longer does this to avoid extra DB calls)
  if (profile?.role === 'admin' && pathname.startsWith('/app/') && !pathname.startsWith('/app/admin')) {
    redirect('/app/admin')
  } else if (profile?.role === 'encargado' && pathname.startsWith('/app/') && !pathname.startsWith('/app/manager/')) {
    redirect('/app/manager/dashboard')
  } else if (profile?.role === 'vendedor' && (pathname.startsWith('/app/manager/') || pathname.startsWith('/app/admin'))) {
    redirect('/app/dashboard')
  }

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset>
        <main className="flex-1 page-enter">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
