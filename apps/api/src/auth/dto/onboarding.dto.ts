import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUrl, IsArray } from 'class-validator';
import { SchoolType, SubscriptionPlan } from '@prisma/client';

export class OnboardingStepDto {
  @IsString()
  token: string;

  @IsInt()
  @Min(1)
  @Max(5)
  step: number;

  stepData: any; // Will be validated based on step
}

// Step 1: Basic School Info
export class BasicInfoDto {
  @IsEnum(SchoolType)
  schoolType: SchoolType;

  @IsString()
  @IsOptional()
  language?: string;

  @IsInt()
  @Min(1)
  @Max(12)
  academicYearStart: number;

  @IsUrl()
  @IsOptional()
  logo?: string;
}

// Step 2: Subscription Selection
export class SubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsInt()
  @Min(1)
  maxBranches: number;

  @IsArray()
  @IsOptional()
  features?: string[];
}

// Step 3: Payment Info
export class PaymentDto {
  @IsString()
  paymentMethod: string; // 'stripe', 'paypal', etc.

  @IsString()
  @IsOptional()
  paymentToken?: string;
}

// Complete Onboarding
export class CompleteOnboardingDto {
  @IsString()
  token: string;
}
