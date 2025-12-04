import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  required?: boolean
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.id} className={cn(required && "after:content-['*'] after:text-red-500 after:ml-1")}>
          {label}
        </Label>
        <Input
          ref={ref}
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"
