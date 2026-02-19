'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, Loader2, UserPlus, CheckCircle2 } from 'lucide-react'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [role, setRole] = useState<'vendedor' | 'encargado'>('vendedor')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/app/dashboard`,
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      
      if (error) throw error

      if (data.session) {
        router.push(role === 'encargado' ? '/app/manager/dashboard' : '/app/dashboard')
      } else {
        router.push('/signup-success')
      }
    } catch (error: unknown) {
      console.log("[v0] signUp error:", error)
      setError(error instanceof Error ? error.message : 'Error al crear cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Left Side - Brand & Value Prop */}
      <div className="hidden lg:flex w-1/2 bg-secondary relative items-center justify-center overflow-hidden">
        {/* Abstract pattern or image */}
        <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-20"></div>
        
        <div className="relative z-10 p-12 max-w-lg">
          <div className="mb-12">
            <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg mb-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-primary mb-4">
              Únete a la red más grande.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Crea tu cuenta hoy y comienza a gestionar tus propiedades con herramientas profesionales diseñadas para agentes de alto rendimiento.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary/80">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span className="font-medium">Gestión de contactos ilimitada</span>
            </div>
            <div className="flex items-center gap-3 text-primary/80">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span className="font-medium">Seguimiento de objetivos en tiempo real</span>
            </div>
            <div className="flex items-center gap-3 text-primary/80">
              <CheckCircle2 className="h-5 w-5 text-accent" />
              <span className="font-medium">Asistente IA integrado 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-heading font-bold tracking-tight">Crear una cuenta</h2>
            <p className="text-muted-foreground mt-2">Completa tus datos personales y profesionales.</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Ej. María González"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="h-11"
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de Perfil</Label>
              <RadioGroup
                defaultValue="vendedor"
                value={role}
                onValueChange={(val) => setRole(val as 'vendedor' | 'encargado')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="vendedor" id="vendedor" className="peer sr-only" />
                  <Label
                    htmlFor="vendedor"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full text-center"
                  >
                    <UserPlus className="mb-2 h-6 w-6" />
                    Agente / Vendedor
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="encargado" id="encargado" className="peer sr-only" />
                  <Label
                    htmlFor="encargado"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer transition-all h-full text-center"
                  >
                    <Building2 className="mb-2 h-6 w-6" />
                    Manager / Encargado
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="nombre@agencia.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password">Confirmar</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-11"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
