'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { Step1Form } from '@/components/onboarding/step1-form'
import { Step2Form } from '@/components/onboarding/step2-form'
import { Step3Form } from '@/components/onboarding/step3-form'
import { onboardingService } from '@/services/onboarding'
import { Step1Data, Step2Data, Step3Data } from '@/lib/validations/onboarding'

// Fallback data - match backend enum values exactly
const defaultSchoolTypes = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'HIGH_SCHOOL', label: 'High School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'MIXED', label: 'Mixed' },
]

const defaultLanguages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
]

const defaultPlans = [
  {
    id: 'FREETRIAL',
    name: 'Free Trial',
    price: 0,
    description: '30-day free trial with basic features',
    maxBranches: 1,
    maxStudents: 50,
    maxTeachers: 5,
    features: ['Basic attendance', 'Student management', 'Basic reports', '30-day trial']
  },
  {
    id: 'STARTER',
    name: 'Starter',
    price: 999,
    description: 'Perfect for small schools',
    maxBranches: 1,
    maxStudents: 200,
    maxTeachers: 15,
    features: ['All Free features', 'Advanced reports', 'Parent portal', 'Email support']
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: 2999,
    description: 'Best for growing schools',
    maxBranches: 3,
    maxStudents: 1000,
    maxTeachers: 50,
    popular: true,
    features: ['All Starter features', 'SMS notifications', 'Exam management', 'Analytics', 'Priority support']
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 9999,
    description: 'For large institutions',
    maxBranches: 10,
    maxStudents: 5000,
    maxTeachers: 200,
    features: ['All Professional features', 'Multi-branch management', 'API access', 'Custom branding', 'Dedicated support']
  },
  {
    id: 'CUSTOM',
    name: 'Custom',
    price: 0,
    description: 'Tailored solution for your needs',
    maxBranches: 999,
    maxStudents: 99999,
    maxTeachers: 9999,
    features: ['Custom features', 'Unlimited everything', 'On-premise deployment', '24/7 support', 'Custom integrations']
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [plans, setPlans] = useState(defaultPlans)
  const [schoolTypes, setSchoolTypes] = useState(defaultSchoolTypes)
  const [languages, setLanguages] = useState(defaultLanguages)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      toast.error('Invalid onboarding link')
      router.push('/auth/login')
      return
    }

    const loadInitialData = async () => {
      try {
        // Try to get status first
        const statusRes = await onboardingService.getStatus(token)
        setCurrentStep(statusRes.currentStep || 1)
        setCompletedSteps(statusRes.completedSteps || [])

        // Try to load additional data, but use fallbacks if they fail
        try {
          const plansRes = await onboardingService.getPlans()
          if (plansRes.plans && Array.isArray(plansRes.plans) && plansRes.plans.length > 0) {
            setPlans(plansRes.plans)
          }
        } catch (error) {
          console.log('Using default plans')
        }

        try {
          const typesRes = await onboardingService.getSchoolTypes()
          if (typesRes.schoolTypes && Array.isArray(typesRes.schoolTypes) && typesRes.schoolTypes.length > 0) {
            setSchoolTypes(typesRes.schoolTypes)
          }
        } catch (error) {
          console.log('Using default school types')
        }

        try {
          const languagesRes = await onboardingService.getLanguages()
          if (languagesRes.languages && Array.isArray(languagesRes.languages) && languagesRes.languages.length > 0) {
            // Map API response to expected format and filter for only en and hi
            const mappedLanguages = languagesRes.languages
              .filter((lang: any) => ['en', 'hi'].includes(lang.code))
              .map((lang: any) => ({
                value: lang.code,
                label: lang.name
              }))
            if (mappedLanguages.length > 0) {
              setLanguages(mappedLanguages)
            }
          }
        } catch (error) {
          console.log('Using default languages')
        }

      } catch (error: any) {
        toast.error(error.message || 'Failed to load onboarding data')
        router.push('/auth/login')
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadInitialData()
  }, [token, router])

  const handleStepSubmit = async (step: number, data: Step1Data | Step2Data | Step3Data) => {
    if (!token) return

    setIsLoading(true)
    try {
      if (step === 2) {
        const step2Data = data as Step2Data
        const plan = plans.find(p => p.id === step2Data.plan)
        setSelectedPlan(plan)
      }

      await onboardingService.submitStep(token, step, data)
      setCompletedSteps(prev => [...prev, step])
      
      if (step < 3) {
        setCurrentStep(step + 1)
        toast.success(`Step ${step} completed!`)
      } else {
        // Step 3 completed, but don't auto-complete onboarding
        setCompletedSteps(prev => [...prev, step])
        toast.success(`Step ${step} completed!`)
      }
    } catch (error: any) {
      toast.error(error.message || `Failed to complete step ${step}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOnboardingComplete = () => {
    setIsOnboardingComplete(true)
  }

  if (isOnboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to Your School!
              </h2>
              <p className="text-gray-600">
                Your account has been set up successfully. You can now log in to access your dashboard.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Login to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const steps = [
    { number: 1, title: 'School Information', description: 'Basic school details' },
    { number: 2, title: 'Subscription Plan', description: 'Choose your plan' },
    { number: 3, title: 'Payment', description: 'Complete payment' },
  ]

  if (isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complete Your School Setup</h1>
          <p className="mt-2 text-gray-600">Just a few more steps to get started</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2
                    ${completedSteps.includes(step.number) 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : currentStep === step.number
                      ? 'border-primary text-primary'
                      : 'border-gray-300 text-gray-300'
                    }
                  `}>
                    {completedSteps.includes(step.number) ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-0.5 bg-gray-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Form */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Step {currentStep}: {steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <Step1Form
                onSubmit={(data) => handleStepSubmit(1, data)}
                isLoading={isLoading}
                schoolTypes={schoolTypes}
                languages={languages}
              />
            )}
            {currentStep === 2 && (
              <Step2Form
                onSubmit={(data) => handleStepSubmit(2, data)}
                isLoading={isLoading}
                plans={plans}
              />
            )}
            {currentStep === 3 && (
              <Step3Form
                onSubmit={(data) => handleStepSubmit(3, data)}
                isLoading={isLoading}
                selectedPlan={selectedPlan}
                token={token}
                onStepComplete={handleOnboardingComplete}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
