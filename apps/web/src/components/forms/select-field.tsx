import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  required?: boolean
  options: { value: string; label: string }[]
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, required, options, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
          {label}
        </Label>
        <Select
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        >
          <option key="default" value="">Select {label}</option>
          {options.map((option, index) => (
            <option key={`${option.value}-${index}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

SelectField.displayName = "SelectField"
