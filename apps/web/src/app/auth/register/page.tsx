import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SchoolSignupForm } from '@/components/forms/school-signup-form'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your school account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Join thousands of schools managing their operations efficiently
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>School Registration</CardTitle>
            <CardDescription>Fill in the details to create your school account</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <SchoolSignupForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
