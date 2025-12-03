import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { OnboardingService } from './services/onboarding.service';
import { OnboardingStepDto, CompleteOnboardingDto } from './dto/onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  // Get current onboarding status
  @Get('status')
  async getStatus(@Query('token') token: string) {
    return this.onboardingService.getOnboardingStatus(token);
  }

  // Update onboarding step
  @Post('step')
  @HttpCode(HttpStatus.OK)
  async updateStep(@Body() dto: OnboardingStepDto) {
    return this.onboardingService.updateOnboardingStep(dto);
  }

  // Complete onboarding
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.completeOnboarding(dto.token);
  }

  // Get subscription plans
  @Get('plans')
  async getSubscriptionPlans() {
    return {
      plans: [
        {
          id: 'STARTER',
          name: 'Starter Plan',
          price: 29,
          currency: 'USD',
          interval: 'month',
          maxBranches: 1,
          maxStudents: 100,
          maxTeachers: 10,
          features: [
            'Basic Attendance Tracking',
            'Grade Management',
            'Student Profiles',
            'Basic Reports',
            'Email Support'
          ]
        },
        {
          id: 'PROFESSIONAL',
          name: 'Professional Plan',
          price: 79,
          currency: 'USD',
          interval: 'month',
          maxBranches: 3,
          maxStudents: 500,
          maxTeachers: 50,
          features: [
            'Everything in Starter',
            'Advanced Reports',
            'Parent Communication',
            'Exam Management',
            'Timetable Management',
            'SMS Notifications',
            'Priority Support'
          ]
        },
        {
          id: 'ENTERPRISE',
          name: 'Enterprise Plan',
          price: 199,
          currency: 'USD',
          interval: 'month',
          maxBranches: 10,
          maxStudents: 2000,
          maxTeachers: 200,
          features: [
            'Everything in Professional',
            'Multi-Branch Management',
            'API Access',
            'Custom Reports',
            'Advanced Analytics',
            'White-label Options',
            'Dedicated Support',
            'Custom Integrations'
          ]
        },
        {
          id: 'CUSTOM',
          name: 'Custom Plan',
          price: 'Contact Us',
          currency: 'USD',
          interval: 'month',
          maxBranches: 'Unlimited',
          maxStudents: 'Unlimited',
          maxTeachers: 'Unlimited',
          features: [
            'Everything in Enterprise',
            'Unlimited Everything',
            'Custom Development',
            'On-premise Deployment',
            '24/7 Dedicated Support',
            'Custom SLA'
          ]
        }
      ]
    };
  }

  // Get school types
  @Get('school-types')
  async getSchoolTypes() {
    return {
      types: [
        { id: 'PRIMARY', name: 'Primary School', description: 'Elementary education (K-5)' },
        { id: 'HIGH_SCHOOL', name: 'High School', description: 'Secondary education (6-12)' },
        { id: 'COLLEGE', name: 'College', description: 'Higher education institution' },
        { id: 'UNIVERSITY', name: 'University', description: 'Research university' },
        { id: 'MIXED', name: 'Mixed Levels', description: 'Multiple education levels' }
      ]
    };
  }

  // Get supported languages
  @Get('languages')
  async getLanguages() {
    return {
      languages: [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ar', name: 'Arabic' },
        { code: 'zh', name: 'Chinese' },
        { code: 'pt', name: 'Portuguese' }
      ]
    };
  }
}
