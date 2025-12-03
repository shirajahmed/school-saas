import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from './email.service';
import { OnboardingStepDto, BasicInfoDto, SubscriptionDto, PaymentDto } from '../dto/onboarding.dto';
import { OnboardingStatus, SubscriptionPlan, SubscriptionStatus, UserStatus } from '@prisma/client';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Get current onboarding status
  async getOnboardingStatus(token: string) {
    const tokenRecord = await this.prisma.userToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            school: {
              include: {
                onboardingData: true,
                subscription: true
              }
            }
          }
        }
      }
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired onboarding token');
    }

    const school = tokenRecord.user.school;
    const onboardingData = school.onboardingData;

    return {
      currentStep: onboardingData?.currentStep || 1,
      completedSteps: onboardingData?.completedSteps || [],
      onboardingStatus: school.onboardingStatus,
      stepData: onboardingData?.stepData || {},
      subscription: school.subscription
    };
  }

  // Update onboarding step
  async updateOnboardingStep(dto: OnboardingStepDto) {
    const tokenRecord = await this.prisma.userToken.findUnique({
      where: { token: dto.token },
      include: { user: { include: { school: true } } }
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired onboarding token');
    }

    const schoolId = tokenRecord.user.schoolId;

    // Validate step data based on step number
    const validatedData = await this.validateStepData(dto.step, dto.stepData);

    // Get existing step data
    const existingData = await this.getExistingStepData(schoolId);
    const newStepData = {
      ...existingData,
      [dto.step]: validatedData
    };

    // Update onboarding data
    const onboardingData = await this.prisma.onboardingData.upsert({
      where: { schoolId },
      create: {
        schoolId,
        currentStep: dto.step,
        stepData: newStepData as any,
        completedSteps: [dto.step]
      },
      update: {
        currentStep: dto.step,
        stepData: newStepData as any,
        completedSteps: {
          push: dto.step
        }
      }
    });

    // Update school onboarding status
    const newStatus = this.getOnboardingStatusFromStep(dto.step);
    await this.prisma.school.update({
      where: { id: schoolId },
      data: { onboardingStatus: newStatus }
    });

    // Process step-specific logic
    await this.processStepLogic(dto.step, validatedData, schoolId);

    return {
      message: `Step ${dto.step} completed successfully`,
      nextStep: dto.step + 1,
      onboardingData
    };
  }

  // Complete entire onboarding process
  async completeOnboarding(token: string) {
    const tokenRecord = await this.prisma.userToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            school: {
              include: {
                onboardingData: true,
                subscription: true
              }
            }
          }
        }
      }
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired onboarding token');
    }

    const school = tokenRecord.user.school;
    const onboardingData = school.onboardingData;
    const subscription = school.subscription;

    // STRICT VALIDATION: Check if all required steps are completed
    const requiredSteps = [1, 2, 3]; // Basic Info, Subscription, Payment
    const completedSteps = onboardingData?.completedSteps || [];
    const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));

    if (missingSteps.length > 0) {
      throw new BadRequestException({
        message: `Cannot complete onboarding. Missing required steps: ${missingSteps.join(', ')}`,
        missingSteps,
        requiredSteps,
        completedSteps
      });
    }

    // STRICT VALIDATION: Verify subscription exists
    if (!subscription) {
      throw new BadRequestException('No subscription found. Please complete subscription step first.');
    }

    // STRICT VALIDATION: Verify payment was processed (for paid plans)
    if (subscription.plan !== 'STARTER' && subscription.status === 'TRIAL') {
      throw new BadRequestException('Payment required for selected plan. Please complete payment step.');
    }

    // STRICT VALIDATION: Check subscription status
    if (!['TRIAL', 'ACTIVE'].includes(subscription.status)) {
      throw new BadRequestException(`Invalid subscription status: ${subscription.status}. Cannot complete onboarding.`);
    }

    // STRICT VALIDATION: Verify step data exists for all required steps
    const stepData = (onboardingData?.stepData as Record<string, any>) || {};
    for (const step of requiredSteps) {
      if (!stepData[step]) {
        throw new BadRequestException(`Step ${step} data is missing. Please complete all steps properly.`);
      }
    }

    // STRICT VALIDATION: Verify basic info is complete
    const basicInfo = stepData[1];
    if (!basicInfo?.schoolType || !basicInfo?.academicYearStart) {
      throw new BadRequestException('Basic school information is incomplete. Please complete Step 1 properly.');
    }

    // STRICT VALIDATION: Verify subscription info is complete
    const subscriptionInfo = stepData[2];
    if (!subscriptionInfo?.plan || !subscriptionInfo?.maxBranches) {
      throw new BadRequestException('Subscription information is incomplete. Please complete Step 2 properly.');
    }

    // STRICT VALIDATION: Verify payment info is complete (for paid plans)
    const paymentInfo = stepData[3];
    if (subscription.plan !== 'STARTER' && !paymentInfo?.paymentMethod) {
      throw new BadRequestException('Payment information is incomplete. Please complete Step 3 properly.');
    }

    // All validations passed - proceed with onboarding completion
    console.log(`✅ All validations passed for school: ${school.name}`);

    // Start background setup process
    await this.startBackgroundSetup(school.id);

    // Mark onboarding as completed
    await this.prisma.$transaction(async (tx) => {
      // Update school
      await tx.school.update({
        where: { id: school.id },
        data: {
          onboarded: true,
          onboardingStatus: OnboardingStatus.COMPLETED
        }
      });

      // Activate user
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { status: UserStatus.ACTIVE }
      });

      // Mark token as used
      await tx.userToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });

      // Update subscription if it was trial
      if (subscription.status === 'TRIAL' && subscription.plan !== 'STARTER') {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { 
            status: SubscriptionStatus.ACTIVE,
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
          }
        });
      }
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      tokenRecord.user.email,
      school.name,
      tokenRecord.user.firstName
    );

    return {
      message: 'Onboarding completed successfully! Welcome to your dashboard.',
      redirectTo: '/dashboard/welcome',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        features: subscription.features
      }
    };
  }

  // Private helper methods
  private async validateStepData(step: number, data: any) {
    switch (step) {
      case 1: // Basic Info
        return this.validateBasicInfo(data);
      case 2: // Subscription
        return this.validateSubscription(data);
      case 3: // Payment
        return this.validatePayment(data);
      default:
        throw new BadRequestException('Invalid step number');
    }
  }

  private validateBasicInfo(data: BasicInfoDto) {
    // Add validation logic here
    return data;
  }

  private validateSubscription(data: SubscriptionDto) {
    // Add validation logic here
    return data;
  }

  private validatePayment(data: PaymentDto) {
    // Add validation logic here
    return data;
  }

  private async getExistingStepData(schoolId: string): Promise<Record<string, any>> {
    const onboardingData = await this.prisma.onboardingData.findUnique({
      where: { schoolId }
    });
    return (onboardingData?.stepData as Record<string, any>) || {};
  }

  private getOnboardingStatusFromStep(step: number): OnboardingStatus {
    switch (step) {
      case 1: return OnboardingStatus.BASIC_INFO;
      case 2: return OnboardingStatus.SUBSCRIPTION;
      case 3: return OnboardingStatus.PAYMENT;
      case 4: return OnboardingStatus.SETUP;
      default: return OnboardingStatus.PENDING;
    }
  }

  private async processStepLogic(step: number, data: any, schoolId: string) {
    switch (step) {
      case 1: // Basic Info
        await this.processBasicInfo(data, schoolId);
        break;
      case 2: // Subscription
        await this.processSubscription(data, schoolId);
        break;
      case 3: // Payment
        await this.processPayment(data, schoolId);
        break;
    }
  }

  private async processBasicInfo(data: BasicInfoDto, schoolId: string) {
    await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        schoolType: data.schoolType,
        language: data.language,
        academicYearStart: data.academicYearStart,
        logo: data.logo
      }
    });
  }

  private async processSubscription(data: SubscriptionDto, schoolId: string) {
    const planLimits = this.getSubscriptionLimits(data.plan);
    
    await this.prisma.subscription.upsert({
      where: { schoolId },
      create: {
        schoolId,
        plan: data.plan,
        status: SubscriptionStatus.TRIAL,
        maxBranches: data.maxBranches,
        maxStudents: planLimits.maxStudents,
        maxTeachers: planLimits.maxTeachers,
        features: data.features || planLimits.features,
        trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      },
      update: {
        plan: data.plan,
        maxBranches: data.maxBranches,
        maxStudents: planLimits.maxStudents,
        maxTeachers: planLimits.maxTeachers,
        features: data.features || planLimits.features
      }
    });

    await this.prisma.school.update({
      where: { id: schoolId },
      data: { maxBranches: data.maxBranches }
    });
  }

  private async processPayment(data: PaymentDto, schoolId: string) {
    // Simulate payment processing
    const paymentSuccess = await this.processPaymentMethod(data);
    
    if (paymentSuccess) {
      await this.prisma.subscription.update({
        where: { schoolId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          paymentId: `pay_${Date.now()}`,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });
    }
  }

  private async processPaymentMethod(data: PaymentDto): Promise<boolean> {
    // Simulate payment processing
    // In real implementation, integrate with Stripe, PayPal, etc.
    return new Promise(resolve => {
      setTimeout(() => resolve(true), 1000);
    });
  }

  private getSubscriptionLimits(plan: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.STARTER]: {
        maxStudents: 100,
        maxTeachers: 10,
        features: ['basic_attendance', 'basic_grades']
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxStudents: 500,
        maxTeachers: 50,
        features: ['attendance', 'grades', 'reports', 'communication']
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxStudents: 2000,
        maxTeachers: 200,
        features: ['all_features', 'api_access', 'custom_reports', 'priority_support']
      },
      [SubscriptionPlan.CUSTOM]: {
        maxStudents: 10000,
        maxTeachers: 1000,
        features: ['unlimited_features']
      }
    };

    return limits[plan];
  }

  private async startBackgroundSetup(schoolId: string) {
    // Simulate background setup process
    // In real implementation, use job queues (Bull, Agenda, etc.)
    setTimeout(async () => {
      await this.setupDefaultData(schoolId);
    }, 100);
  }

  private async setupDefaultData(schoolId: string) {
    // Create default classes, subjects, etc.
    // This runs in background after onboarding completion
    console.log(`Setting up default data for school: ${schoolId}`);
    
    // Add default setup logic here
    // - Create default classes
    // - Setup default subjects
    // - Configure default settings
    // - Setup permissions based on subscription
  }
}
