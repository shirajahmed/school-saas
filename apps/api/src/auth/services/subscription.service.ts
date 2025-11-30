import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Get school's current subscription with usage stats
  async getSchoolSubscription(schoolId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { schoolId },
      include: { school: true }
    });

    if (!subscription) {
      throw new ForbiddenException('No subscription found');
    }

    // Get current usage
    const usage = await this.getCurrentUsage(schoolId);
    const limits = this.getPlanLimits(subscription.plan);
    const features = this.getPlanFeatures(subscription.plan);

    return {
      subscription,
      usage,
      limits,
      features,
      utilization: {
        branches: `${usage.branches}/${limits.maxBranches}`,
        students: `${usage.students}/${limits.maxStudents}`,
        teachers: `${usage.teachers}/${limits.maxTeachers}`,
        users: `${usage.users}/${limits.maxUsers}`
      }
    };
  }

  // Check if school can perform action based on subscription
  async canPerformAction(schoolId: string, action: string, resource: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { schoolId }
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Check feature access
    if (action === 'USE_FEATURE') {
      const features = this.getPlanFeatures(subscription.plan);
      return features.includes(resource) || subscription.features.includes(resource);
    }

    // Check limits
    if (action === 'CREATE') {
      const usage = await this.getCurrentUsage(schoolId);
      const limits = this.getPlanLimits(subscription.plan);

      switch (resource) {
        case 'BRANCHES':
          return usage.branches < limits.maxBranches;
        case 'STUDENTS':
          return usage.students < limits.maxStudents;
        case 'TEACHERS':
          return usage.teachers < limits.maxTeachers;
        case 'USERS':
          return usage.users < limits.maxUsers;
        default:
          return true;
      }
    }

    return true;
  }

  // Upgrade/downgrade subscription
  async updateSubscription(schoolId: string, newPlan: SubscriptionPlan, paymentId?: string) {
    const currentSubscription = await this.prisma.subscription.findUnique({
      where: { schoolId }
    });

    if (!currentSubscription) {
      throw new ForbiddenException('No subscription found');
    }

    // Check if downgrade is possible (usage within new limits)
    if (this.isPlanDowngrade(currentSubscription.plan, newPlan)) {
      const canDowngrade = await this.canDowngradeTo(schoolId, newPlan);
      if (!canDowngrade) {
        throw new ForbiddenException('Cannot downgrade: current usage exceeds new plan limits');
      }
    }

    const newLimits = this.getPlanLimits(newPlan);
    const newFeatures = this.getPlanFeatures(newPlan);

    return this.prisma.subscription.update({
      where: { schoolId },
      data: {
        plan: newPlan,
        maxBranches: newLimits.maxBranches,
        maxStudents: newLimits.maxStudents,
        maxTeachers: newLimits.maxTeachers,
        features: newFeatures,
        paymentId: paymentId || currentSubscription.paymentId,
        updatedAt: new Date()
      }
    });
  }

  // Get usage statistics
  private async getCurrentUsage(schoolId: string) {
    const [branches, students, teachers, users, classes] = await Promise.all([
      this.prisma.branch.count({ where: { schoolId } }),
      this.prisma.student.count({ where: { schoolId } }),
      this.prisma.teacher.count({ where: { schoolId } }),
      this.prisma.user.count({ where: { schoolId } }),
      this.prisma.class.count({ where: { schoolId } })
    ]);

    return { branches, students, teachers, users, classes };
  }

  private getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      [SubscriptionPlan.STARTER]: {
        maxBranches: 1,
        maxStudents: 100,
        maxTeachers: 10,
        maxUsers: 15,
        maxClasses: 10
      },
      [SubscriptionPlan.PROFESSIONAL]: {
        maxBranches: 3,
        maxStudents: 500,
        maxTeachers: 50,
        maxUsers: 75,
        maxClasses: 50
      },
      [SubscriptionPlan.ENTERPRISE]: {
        maxBranches: 10,
        maxStudents: 2000,
        maxTeachers: 200,
        maxUsers: 300,
        maxClasses: 200
      },
      [SubscriptionPlan.CUSTOM]: {
        maxBranches: 999999,
        maxStudents: 999999,
        maxTeachers: 999999,
        maxUsers: 999999,
        maxClasses: 999999
      }
    };

    return limits[plan];
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
      [SubscriptionPlan.CUSTOM]: ['all_features']
    };

    return features[plan] || [];
  }

  private isPlanDowngrade(currentPlan: SubscriptionPlan, newPlan: SubscriptionPlan): boolean {
    const planHierarchy = {
      [SubscriptionPlan.STARTER]: 1,
      [SubscriptionPlan.PROFESSIONAL]: 2,
      [SubscriptionPlan.ENTERPRISE]: 3,
      [SubscriptionPlan.CUSTOM]: 4
    };

    return planHierarchy[newPlan] < planHierarchy[currentPlan];
  }

  private async canDowngradeTo(schoolId: string, newPlan: SubscriptionPlan): Promise<boolean> {
    const usage = await this.getCurrentUsage(schoolId);
    const newLimits = this.getPlanLimits(newPlan);

    return (
      usage.branches <= newLimits.maxBranches &&
      usage.students <= newLimits.maxStudents &&
      usage.teachers <= newLimits.maxTeachers &&
      usage.users <= newLimits.maxUsers
    );
  }
}
