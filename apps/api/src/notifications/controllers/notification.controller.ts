import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permission.guard';
import { CanManage, CanRead, CanCreate } from '../../auth/decorators/permissions.decorator';
import { PermissionResource, NotificationType, NotificationChannel, TargetType, UserRole } from '@prisma/client';
import { NotificationService } from '../services/notification.service';
import { QueueService } from '../services/queue.service';
import { NotificationGateway } from '../gateways/notification.gateway';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private queueService: QueueService,
    private notificationGateway: NotificationGateway,
  ) {}

  // Create notification
  @Post()
  @CanCreate(PermissionResource.SETTINGS)
  async create(@Body() createNotificationDto: {
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
    scheduledAt?: string;
    expiresAt?: string;
    schoolId?: string; // Allow specifying school for platform admins
  }, @Request() req) {
    
    // Determine school context
    let schoolId = req.user.schoolId;
    
    // If platform admin (no schoolId), require schoolId in request
    if (!schoolId) {
      if (!createNotificationDto.schoolId) {
        return {
          message: 'Platform-level admins must specify schoolId in request body',
          error: 'SCHOOL_ID_REQUIRED'
        };
      }
      schoolId = createNotificationDto.schoolId;
    }
    
    const notification = await this.notificationService.createNotification({
      schoolId: schoolId,
      branchId: req.user.branchId,
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      type: createNotificationDto.type,
      channels: createNotificationDto.channels,
      targetType: createNotificationDto.targetType,
      targetRoles: createNotificationDto.targetRoles,
      targetUserIds: createNotificationDto.targetUserIds,
      targetBranchIds: createNotificationDto.targetBranchIds,
      targetClassIds: createNotificationDto.targetClassIds,
      targetSectionIds: createNotificationDto.targetSectionIds,
      filters: createNotificationDto.filters,
      scheduledAt: createNotificationDto.scheduledAt ? new Date(createNotificationDto.scheduledAt) : undefined,
      expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined,
      createdBy: req.user.sub
    });

    // Send real-time notifications if IN_APP channel is included
    if (createNotificationDto.channels.includes(NotificationChannel.IN_APP)) {
      await this.sendRealTimeNotifications(notification.id, createNotificationDto);
    }

    return {
      message: 'Notification created successfully',
      notification
    };
  }

  // Helper method to send real-time notifications
  private async sendRealTimeNotifications(notificationId: string, notificationData: any) {
    // Get the notification with deliveries
    const notification = await this.notificationService['prisma'].notification.findUnique({
      where: { id: notificationId },
      include: {
        deliveries: {
          where: { channel: NotificationChannel.IN_APP },
          include: { user: true }
        }
      }
    });

    if (!notification) return;

    // Send to each user via WebSocket
    for (const delivery of notification.deliveries) {
      const notificationPayload = {
        id: delivery.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt
      };

      this.notificationGateway.sendToUser(delivery.userId, notificationPayload);
    }
  }

  // Get user's notifications (in-app)
  @Get('my-notifications')
  async getMyNotifications(@Query() query: { limit?: string; offset?: string }, @Request() req) {
    const limit = query.limit ? parseInt(query.limit) : 20;
    const offset = query.offset ? parseInt(query.offset) : 0;

    return this.notificationService.getUserNotifications(req.user.sub, limit, offset);
  }

  // Mark notification as read
  @Put(':deliveryId/read')
  async markAsRead(@Param('deliveryId') deliveryId: string, @Request() req) {
    return this.notificationService.markAsRead(deliveryId, req.user.sub);
  }

  // Get notification statistics
  @Get('stats')
  @CanRead(PermissionResource.ANALYTICS)
  async getStats(@Query() query: { startDate?: string; endDate?: string }, @Request() req) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return this.notificationService.getNotificationStats(req.user.schoolId, startDate, endDate);
  }

  // Get queue statistics
  @Get('queue/stats')
  @CanRead(PermissionResource.ANALYTICS)
  async getQueueStats() {
    return this.queueService.getQueueStats();
  }

  // Send test notification
  @Post('test')
  @CanCreate(PermissionResource.SETTINGS)
  async sendTestNotification(@Body() testDto: {
    title: string;
    message: string;
    channels: NotificationChannel[];
  }, @Request() req) {
    
    // For platform-level admins (Master Super Admin), use a default school or handle differently
    if (!req.user.schoolId) {
      return {
        message: 'Platform-level admins cannot send school notifications. Please specify a school context.',
        error: 'NO_SCHOOL_CONTEXT'
      };
    }
    
    const notification = await this.notificationService.createNotification({
      schoolId: req.user.schoolId,
      title: `[TEST] ${testDto.title}`,
      message: testDto.message,
      type: NotificationType.ANNOUNCEMENT,
      channels: testDto.channels,
      targetType: TargetType.SPECIFIC_USERS,
      targetUserIds: [req.user.sub], // Send to self
      createdBy: req.user.sub
    });

    // Send real-time notification if IN_APP channel is included
    if (testDto.channels.includes(NotificationChannel.IN_APP)) {
      await this.sendRealTimeNotifications(notification.id, {
        ...testDto,
        targetType: TargetType.SPECIFIC_USERS,
        targetUserIds: [req.user.sub]
      });
    }

    return {
      message: 'Test notification sent',
      notification
    };
  }

  // Broadcast announcement
  @Post('broadcast')
  @CanManage(PermissionResource.SETTINGS)
  async broadcastAnnouncement(@Body() broadcastDto: {
    title: string;
    message: string;
    channels: NotificationChannel[];
    targetType: TargetType;
    targetRoles?: UserRole[];
    schoolId?: string; // Allow specifying school for platform admins
  }, @Request() req) {
    
    // Determine school context
    let schoolId = req.user.schoolId;
    
    // If platform admin (no schoolId), require schoolId in request
    if (!schoolId) {
      if (!broadcastDto.schoolId) {
        return {
          message: 'Platform-level admins must specify schoolId in request body',
          error: 'SCHOOL_ID_REQUIRED'
        };
      }
      schoolId = broadcastDto.schoolId;
    }
    
    const notification = await this.notificationService.createNotification({
      schoolId: schoolId,
      title: broadcastDto.title,
      message: broadcastDto.message,
      type: NotificationType.ANNOUNCEMENT,
      channels: broadcastDto.channels,
      targetType: broadcastDto.targetType,
      targetRoles: broadcastDto.targetRoles,
      createdBy: req.user.sub
    });

    // Send real-time notifications if IN_APP channel is included
    if (broadcastDto.channels.includes(NotificationChannel.IN_APP)) {
      await this.sendRealTimeNotifications(notification.id, broadcastDto);
    }

    return {
      message: 'Announcement broadcasted successfully',
      notification
    };
  }

  // Simple test endpoint for WebSocket
  @Post('test-websocket')
  @CanCreate(PermissionResource.SETTINGS)
  async testWebSocket(@Body() testDto: {
    title: string;
    message: string;
  }, @Request() req) {
    
    // Send directly via WebSocket without creating notification in DB
    const notification = {
      id: 'test-' + Date.now(),
      title: testDto.title,
      message: testDto.message,
      type: 'ANNOUNCEMENT',
      createdAt: new Date(),
      expiresAt: null
    };

    const sent = this.notificationGateway.sendToUser(req.user.sub, notification);

    return {
      message: 'WebSocket test notification sent',
      sent: sent,
      connectedUsers: this.notificationGateway.getConnectedUsersCount(),
      userId: req.user.sub
    };
  }
  // Get notification templates
  @Get('templates')
  @CanRead(PermissionResource.SETTINGS)
  async getTemplates() {
    return {
      templates: [
        {
          id: 'exam_reminder',
          name: 'Exam Reminder',
          title: 'Upcoming Exam: {examName}',
          message: 'Dear {studentName}, you have an upcoming {subject} exam on {examDate}. Please prepare accordingly.',
          type: NotificationType.REMINDER,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          targetType: TargetType.CLASS_WISE
        },
        {
          id: 'fee_due',
          name: 'Fee Due Reminder',
          title: 'Fee Payment Due',
          message: 'Dear Parent, the fee payment for {studentName} is due on {dueDate}. Amount: {amount}',
          type: NotificationType.FEE_DUE,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS],
          targetType: TargetType.SPECIFIC_USERS
        },
        {
          id: 'attendance_alert',
          name: 'Low Attendance Alert',
          title: 'Low Attendance Alert',
          message: 'Dear Parent, {studentName}\'s attendance is below 75%. Current attendance: {percentage}%',
          type: NotificationType.ATTENDANCE_ALERT,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          targetType: TargetType.SPECIFIC_USERS
        },
        {
          id: 'result_published',
          name: 'Exam Results Published',
          title: 'Exam Results Available',
          message: 'Dear {studentName}, your {examName} results are now available. Please check your dashboard.',
          type: NotificationType.EXAM_RESULT,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          targetType: TargetType.CLASS_WISE
        }
      ]
    };
  }
}
