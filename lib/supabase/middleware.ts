import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Redirect unauthenticated users trying to access the app
  if (pathname.startsWith('/app') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/app')) {
    // Fetch profile for role-based routing
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'vendedor'

    // Admin: only allow /app/admin
    if (role === 'admin' && !pathname.startsWith('/app/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/admin'
      return NextResponse.redirect(url)
    }

    // Encargado: only allow /app/manager/*
    if (role === 'encargado' && !pathname.startsWith('/app/manager')) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/manager/dashboard'
      return NextResponse.redirect(url)
    }

    // Vendedor: block /app/manager and /app/admin
    if (role === 'vendedor' && (pathname.startsWith('/app/manager') || pathname.startsWith('/app/admin'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/app/dashboard'
      return NextResponse.redirect(url)
    }

    // Pass pathname header for layout to read
    supabaseResponse.headers.set('x-pathname', pathname)
  }

  // Add security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocations=()')
  
  // Strict-Transport-Security (HSTS) - 1 year
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Content Security Policy (Basic)
  // Note: Adjust as needed for external resources like Supabase or n8n
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.supabase.co;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()
  
  supabaseResponse.headers.set('Content-Security-Policy', cspHeader)

  // Redirect authenticated users away from login/signup
  if (
    (pathname === '/login' || pathname === '/signup') &&
    user
  ) {
    // Need to know role for correct redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    const r = profile?.role
    url.pathname = r === 'admin' ? '/app/admin' : r === 'encargado' ? '/app/manager/dashboard' : '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const url = request.nextUrl.clone()
      const r = profile?.role
      url.pathname = r === 'admin' ? '/app/admin' : r === 'encargado' ? '/app/manager/dashboard' : '/app/dashboard'
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
