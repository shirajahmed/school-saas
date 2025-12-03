import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../auth/services/email.service';
import { NotificationType, NotificationChannel, TargetType, UserRole, DeliveryStatus } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Create notification
  async createNotification(data: {
    schoolId: string;
    branchId?: string;
    title: string;
    message: string;
    type: NotificationType;
    channels: NotificationChannel[];
    targetType: TargetType;
    targetRoles?: UserRole[];
    targetUserIds?: string[];
    targetBranchIds?: string[];
    targetClassIds?: string[];
    targetSectionIds?: string[];
    filters?: any;
    scheduledAt?: Date;
    expiresAt?: Date;
    createdBy: string;
  }) {
    // Create notification
    const notification = await this.prisma.notification.create({
      data: {
        schoolId: data.schoolId,
        branchId: data.branchId,
        title: data.title,
        message: data.message,
        type: data.type,
        channels: data.channels,
        targetType: data.targetType,
        targetRoles: data.targetRoles || [],
        targetUserIds: data.targetUserIds || [],
        targetBranchIds: data.targetBranchIds || [],
        targetClassIds: data.targetClassIds || [],
        targetSectionIds: data.targetSectionIds || [],
        filters: data.filters,
        scheduledAt: data.scheduledAt,
        expiresAt: data.expiresAt,
        createdBy: data.createdBy
      }
    });

    // Get target users
    const targetUsers = await this.getTargetUsers(notification);

    // Create delivery records
    await this.createDeliveryRecords(notification.id, targetUsers, data.channels);

    // Process immediate notifications
    if (!data.scheduledAt || data.scheduledAt <= new Date()) {
      await this.processNotification(notification.id);
    }

    // Log audit
    await this.logAudit('notification', notification.id, 'CREATE', null, notification, data.createdBy, data.schoolId);

    return notification;
  }

  // Get target users based on targeting rules
  private async getTargetUsers(notification: any): Promise<string[]> {
    let userIds: string[] = [];

    switch (notification.targetType) {
      case TargetType.ALL_USERS:
        const allUsers = await this.prisma.user.findMany({
          where: { schoolId: notification.schoolId, status: 'ACTIVE' },
          select: { id: true }
        });
        userIds = allUsers.map(u => u.id);
        break;

      case TargetType.SPECIFIC_ROLES:
        const roleUsers = await this.prisma.user.findMany({
          where: {
            schoolId: notification.schoolId,
            status: 'ACTIVE',
            role: { in: notification.targetRoles }
          },
          select: { id: true }
        });
        userIds = roleUsers.map(u => u.id);
        break;

      case TargetType.SPECIFIC_USERS:
        userIds = notification.targetUserIds;
        break;

      case TargetType.BRANCH_WISE:
        const branchUsers = await this.prisma.user.findMany({
          where: {
            schoolId: notification.schoolId,
            status: 'ACTIVE',
            branchId: { in: notification.targetBranchIds }
          },
          select: { id: true }
        });
        userIds = branchUsers.map(u => u.id);
        break;

      case TargetType.CLASS_WISE:
        const classUsers = await this.prisma.user.findMany({
          where: {
            schoolId: notification.schoolId,
            status: 'ACTIVE',
            OR: [
              { student: { classId: { in: notification.targetClassIds } } },
              { teacher: { classes: { some: { id: { in: notification.targetClassIds } } } } }
            ]
          },
          select: { id: true }
        });
        userIds = classUsers.map(u => u.id);
        break;

      case TargetType.SECTION_WISE:
        const sectionUsers = await this.prisma.user.findMany({
          where: {
            schoolId: notification.schoolId,
            status: 'ACTIVE',
            OR: [
              { student: { sectionId: { in: notification.targetSectionIds } } },
              { teacher: { sections: { some: { id: { in: notification.targetSectionIds } } } } }
            ]
          },
          select: { id: true }
        });
        userIds = sectionUsers.map(u => u.id);
        break;
    }

    return [...new Set(userIds)]; // Remove duplicates
  }

  // Create delivery records for each user and channel
  private async createDeliveryRecords(notificationId: string, userIds: string[], channels: NotificationChannel[]) {
    const deliveryRecords = [];

    for (const userId of userIds) {
      for (const channel of channels) {
        deliveryRecords.push({
          notificationId,
          userId,
          channel,
          status: DeliveryStatus.PENDING
        });
      }
    }

    if (deliveryRecords.length > 0) {
      await this.prisma.notificationDelivery.createMany({
        data: deliveryRecords
      });
    }
  }

  // Process notification (send to queue)
  async processNotification(notificationId: string) {
    const deliveries = await this.prisma.notificationDelivery.findMany({
      where: {
        notificationId,
        status: DeliveryStatus.PENDING
      }
    });

    // Update all deliveries to DELIVERED status and trigger real-time notifications
    for (const delivery of deliveries) {
      if (delivery.channel === NotificationChannel.IN_APP) {
        // Mark as delivered immediately for in-app notifications
        await this.prisma.notificationDelivery.update({
          where: { id: delivery.id },
          data: {
            status: DeliveryStatus.DELIVERED,
            deliveredAt: new Date()
          }
        });
      }
    }

    return {
      message: `${deliveries.length} notifications processed`,
      count: deliveries.length
    };
  }

  // Get notifications for user (in-app)
  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0) {
    return this.prisma.notificationDelivery.findMany({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: DeliveryStatus.DELIVERED
      },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            createdAt: true,
            expiresAt: true
          }
        }
      },
      orderBy: { deliveredAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  // Mark notification as read
  async markAsRead(deliveryId: string, userId: string) {
    return this.prisma.notificationDelivery.update({
      where: {
        id: deliveryId,
        userId // Ensure user can only mark their own notifications
      },
      data: {
        metadata: { readAt: new Date() }
      }
    });
  }

  // Get notification statistics
  async getNotificationStats(schoolId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      notification: { schoolId }
    };

    if (startDate && endDate) {
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const stats = await this.prisma.notificationDelivery.groupBy({
      by: ['status', 'channel'],
      where,
      _count: { status: true }
    });

    return stats;
  }

  // Log audit trail
  private async logAudit(entityType: string, entityId: string, action: string, oldValues: any, newValues: any, performedBy: string, schoolId: string) {
    await this.prisma.auditLog.create({
      data: {
        schoolId,
        entityType,
        entityId,
        action,
        oldValues,
        newValues,
        performedBy
      }
    });
  }
}
