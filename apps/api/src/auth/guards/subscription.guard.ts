import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../common/database/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

export const SUBSCRIPTION_FEATURE_KEY = 'subscription_feature';
export const SUBSCRIPTION_LIMIT_KEY = 'subscription_limit';

export interface SubscriptionFeature {
  feature: string;
  required: boolean;
}

export interface SubscriptionLimit {
  resource: string;
  action: string;
}

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<SubscriptionFeature>(
      SUBSCRIPTION_FEATURE_KEY,
      context.getHandler(),
    );

    const limitCheck = this.reflector.get<SubscriptionLimit>(
      SUBSCRIPTION_LIMIT_KEY,
      context.getHandler(),
    );

    if (!requiredFeature && !limitCheck) {
      return true; // No subscription requirements
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.schoolId) {
      return true; // Platform admins bypass subscription checks
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { schoolId: user.schoolId },
      include: { school: true }
    });

    if (!subscription) {
      throw new ForbiddenException('No active subscription found');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIAL) {
      throw new ForbiddenException('Subscription is not active');
    }

    // Check feature access
    if (requiredFeature) {
      const hasFeature = this.checkFeatureAccess(subscription, requiredFeature.feature);
      if (!hasFeature) {
        throw new ForbiddenException(`Feature '${requiredFeature.feature}' not available in your plan`);
      }
    }

    // Check limits
    if (limitCheck) {
      const withinLimits = await this.checkLimits(subscription, limitCheck, user.schoolId);
      if (!withinLimits) {
        throw new ForbiddenException(`${limitCheck.resource} limit exceeded for your plan`);
      }
    }

    return true;
  }

  private checkFeatureAccess(subscription: any, feature: string): boolean {
    const planFeatures = this.getPlanFeatures(subscription.plan);
    return planFeatures.includes(feature) || subscription.features.includes(feature);
  }

  private async checkLimits(subscription: any, limitCheck: SubscriptionLimit, schoolId: string): Promise<boolean> {
    const limits = this.getPlanLimits(subscription.plan);
    
    switch (limitCheck.resource) {
      case 'BRANCHES':
        const branchCount = await this.prisma.branch.count({ where: { schoolId } });
        return branchCount < limits.maxBranches;
        
      case 'STUDENTS':
        const studentCount = await this.prisma.student.count({ where: { schoolId } });
        return studentCount < limits.maxStudents;
        
      case 'TEACHERS':
        const teacherCount = await this.prisma.teacher.count({ where: { schoolId } });
        return teacherCount < limits.maxTeachers;
        
      case 'USERS':
        const userCount = await this.prisma.user.count({ where: { schoolId } });
        return userCount < limits.maxUsers;
        
      default:
        return true;
    }
  }

  private getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features = {
      [SubscriptionPlan.STARTER]: [
        'basic_attendance',
        'basic_grades',
        'student_profiles',
        'basic_reports'
      ],
      [SubscriptionPlan.PROFESSIONAL]: [
        'basic_attendance',
        'basic_grades', 
        'student_profiles',
        'basic_reports',
        'advanced_reports',
        'parent_communication',
        'exam_management',
        'timetable_management',
        'sms_notifications',
        'bulk_operations'
      ],
      [SubscriptionPlan.ENTERPRISE]: [
        'basic_attendance',
        'basic_grades',
        'student_profiles', 
        'basic_reports',
        'advanced_reports',
        'parent_communication',
        'exam_management',
        'timetable_management',
        'sms_notifications',
        'bulk_operations',
        'multi_branch_management',
        'api_access',
        'custom_reports',
        'advanced_analytics',
        'white_label',
        'integrations'
      ],
      [SubscriptionPlan.CUSTOM]: [
        'all_features'
      ]
    };

    return features[plan] || [];
  }

  private getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.STARTER]: {
        maxBranches: 1,
        maxStudents: 100,
        maxTeachers: 10,
        maxUsers: 15,
        maxClasses: 10,
        maxExamsPerMonth: 5
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxBranches: 3,
        maxStudents: 500,
        maxTeachers: 50,
        maxUsers: 75,
        maxClasses: 50,
        maxExamsPerMonth: 25
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxBranches: 10,
        maxStudents: 2000,
        maxTeachers: 200,
        maxUsers: 300,
        maxClasses: 200,
        maxExamsPerMonth: 100
      },
      [SubscriptionPlan.CUSTOM]: {
        maxBranches: 999999,
        maxStudents: 999999,
        maxTeachers: 999999,
        maxUsers: 999999,
        maxClasses: 999999,
        maxExamsPerMonth: 999999
      }
    };

    return limits[plan];
  }
}
