'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/form-field'
import { SelectField } from '@/components/forms/select-field'
import { step1Schema, type Step1Data } from '@/lib/validations/onboarding'

interface Step1FormProps {
  onSubmit: (data: Step1Data) => void
  isLoading: boolean
  schoolTypes: { value: string; label: string }[]
  languages: { value: string; label: string }[]
}

const monthOptions = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

export function Step1Form({ onSubmit, isLoading, schoolTypes, languages }: Step1FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      academicYearStart: 4,
    },
  })

  console.log('Languages in Step1Form:', languages)
  console.log('School Types in Step1Form:', schoolTypes)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <SelectField
        label="School Type"
        options={schoolTypes}
        error={errors.schoolType?.message}
        required
        {...register('schoolType')}
      />

      <SelectField
        label="Language"
        options={languages}
        error={errors.language?.message}
        required
        {...register('language')}
      />

      <SelectField
        label="Academic Year Start Month"
        options={monthOptions}
        error={errors.academicYearStart?.message}
        required
        {...register('academicYearStart', { valueAsNumber: true })}
      />

      <FormField
        label="School Logo URL"
        type="url"
        placeholder="https://example.com/logo.png (optional)"
        error={errors.logo?.message}
        {...register('logo')}
      />

      <Button type="submit" className="w-full" disabled={!isValid || isLoading}>
        {isLoading ? 'Saving...' : 'Continue'}
      </Button>
    </form>
  )
}
