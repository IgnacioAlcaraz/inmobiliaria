import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import type { Profile } from '@/lib/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as Profile | null

  // Role-based redirects
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  if (typedProfile?.role === 'encargado') {
    // Encargado accessing vendedor pages -> redirect to manager section
    if (pathname.startsWith('/app/') && !pathname.startsWith('/app/manager/')) {
      redirect('/app/manager/dashboard')
    }
  } else if (typedProfile?.role !== 'admin') {
    // Vendedor accessing manager pages -> redirect to dashboard
    if (pathname.startsWith('/app/manager/')) {
      redirect('/app/dashboard')
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar profile={typedProfile} />
      <SidebarInset>
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
