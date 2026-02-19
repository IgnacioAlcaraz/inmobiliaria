import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, MailCheck } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">RE/MAX CRM</span>
          </div>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <MailCheck className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">Cuenta Creada</CardTitle>
              <CardDescription>
                Revisa tu email para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Te enviamos un email de confirmacion. Haz clic en el enlace para
                activar tu cuenta y luego inicia sesion.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
