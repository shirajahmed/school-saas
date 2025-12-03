'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: (value: any) => string | null;
  gridCols?: 1 | 2;
}

interface FormProps {
  title?: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  submitText?: string;
  loading?: boolean;
  initialData?: Record<string, any>;
  className?: string;
}

export function Form({
  title,
  description,
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false,
  initialData = {},
  className
}: FormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];
      
      // Required validation
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      // Custom validation
      if (field.validation && value) {
        const error = field.validation(value);
        if (error) {
          newErrors[field.name] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];

    const fieldProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
      className: error ? 'border-red-500' : '',
    };

    let input;
    switch (field.type) {
      case 'select':
        input = (
          <Select
            {...fieldProps}
            options={field.options || []}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
        break;
      case 'textarea':
        input = (
          <Textarea
            {...fieldProps}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
        break;
      default:
        input = (
          <Input
            {...fieldProps}
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );
    }

    return (
      <div 
        key={field.name} 
        className={cn(
          "space-y-2",
          field.gridCols === 2 ? "col-span-2" : "col-span-1"
        )}
      >
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {input}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(renderField)}
      </div>
      
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : submitText}
        </Button>
      </div>
    </form>
  );

  if (title || description) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
}
