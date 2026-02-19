'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/app/dashboard')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Brand & Aesthetic */}
      <div className="hidden lg:flex w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 p-12 text-primary-foreground max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
              <Building2 className="h-7 w-7" />
            </div>
            <span className="text-3xl font-heading font-bold tracking-tight">RE/MAX CRM</span>
          </div>
          <h1 className="text-5xl font-heading font-bold mb-6 leading-tight">
            Gestión inmobiliaria inteligente.
          </h1>
          <p className="text-lg opacity-90 leading-relaxed">
            Optimiza tus ventas, gestiona tus propiedades y conecta con tus clientes de manera eficiente con nuestra plataforma diseñada para el éxito.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-heading font-bold tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-muted-foreground mt-2">Ingresa tus credenciales para acceder a tu panel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@remax.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-11"
                aria-invalid={!!error}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿No tienes una cuenta? </span>
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Solicitar acceso
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
