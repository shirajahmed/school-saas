'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { step2Schema, type Step2Data } from '@/lib/validations/onboarding'

interface Step2FormProps {
  onSubmit: (data: Step2Data) => void
  isLoading: boolean
  plans: any[]
}

export function Step2Form({ onSubmit, isLoading, plans }: Step2FormProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('')

  const {
    handleSubmit,
    formState: { isValid },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
  })

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleFormSubmit = () => {
    const planData = plans.find(p => p.id === selectedPlan)
    if (!planData) return

    onSubmit({
      plan: selectedPlan as any,
      maxBranches: planData.maxBranches,
      features: planData.features,
    })
  }

  const currentPlan = plans.find(p => p.id === selectedPlan)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Your Plan</h3>
        <p className="text-gray-600">Select the plan that best fits your school's needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <CardHeader className="text-center">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.id === 'FREETRIAL' && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                      Free
                    </span>
                  )}
                  {plan.popular && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                      Popular
                    </span>
                  )}
                </div>
                {selectedPlan === plan.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-gray-500">/month</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Max Branches:</span> {plan.maxBranches}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Max Students:</span> {plan.maxStudents}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Max Teachers:</span> {plan.maxTeachers}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Features:</h4>
                <ul className="space-y-1">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="text-sm flex items-center">
                      <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Selected Plan: {currentPlan?.name}</h4>
          <p className="text-sm text-gray-600 mb-3">
            {currentPlan?.price === 0 
              ? 'Start with our free trial - no payment required!' 
              : `Monthly cost: ₹${currentPlan?.price}`
            }
          </p>
          <Button 
            onClick={handleFormSubmit}
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 
             currentPlan?.price === 0 ? 'Start Free Trial' : 'Continue to Payment'
            }
          </Button>
        </div>
      )}

      {!selectedPlan && (
        <div className="text-center">
          <p className="text-gray-500">Please select a plan to continue</p>
        </div>
      )}
    </div>
  )
}
