import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardContent className="pt-6">
            <Suspense fallback={<div>Loading...</div>}>
              <ForgotPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
