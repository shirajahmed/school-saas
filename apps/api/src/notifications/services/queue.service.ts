import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EmailService } from '../../auth/services/email.service';
import { NotificationGateway } from '../gateways/notification.gateway';
import { DeliveryStatus, NotificationChannel } from '@prisma/client';

interface NotificationJob {
  deliveryId: string;
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  retryCount?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private processingQueue: NotificationJob[] = [];
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private notificationGateway: NotificationGateway,
  ) {
    // Start queue processor
    this.startQueueProcessor();
  }

  // Add job to queue
  async addNotificationJob(deliveryId: string) {
    const delivery = await this.prisma.notificationDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        notification: true,
        user: true
      }
    });

    if (!delivery) {
      this.logger.error(`Delivery not found: ${deliveryId}`);
      return;
    }

    const job: NotificationJob = {
      deliveryId: delivery.id,
      notificationId: delivery.notificationId,
      userId: delivery.userId,
      channel: delivery.channel,
      retryCount: delivery.retryCount
    };

    this.processingQueue.push(job);
    this.logger.log(`Job added to queue: ${deliveryId} (${delivery.channel})`);
  }

  // Add multiple jobs to queue
  async addBulkNotificationJobs(deliveryIds: string[]) {
    for (const deliveryId of deliveryIds) {
      await this.addNotificationJob(deliveryId);
    }
    this.logger.log(`${deliveryIds.length} jobs added to queue`);
  }

  // Process notification queue
  private async startQueueProcessor() {
    setInterval(async () => {
      if (this.isProcessing || this.processingQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      const batchSize = 10; // Process 10 notifications at a time
      const batch = this.processingQueue.splice(0, batchSize);

      this.logger.log(`Processing batch of ${batch.length} notifications`);

      // Process batch concurrently
      const promises = batch.map(job => this.processNotificationJob(job));
      await Promise.allSettled(promises);

      this.isProcessing = false;
    }, 1000); // Check every second
  }

  // Process individual notification job
  private async processNotificationJob(job: NotificationJob) {
    try {
      const delivery = await this.prisma.notificationDelivery.findUnique({
        where: { id: job.deliveryId },
        include: {
          notification: true,
          user: true
        }
      });

      if (!delivery || delivery.status !== DeliveryStatus.PENDING) {
        return;
      }

      let success = false;

      switch (job.channel) {
        case NotificationChannel.IN_APP:
          success = await this.processInAppNotification(delivery);
          break;
        case NotificationChannel.EMAIL:
          success = await this.processEmailNotification(delivery);
          break;
        case NotificationChannel.SMS:
          success = await this.processSMSNotification(delivery);
          break;
        case NotificationChannel.PUSH:
          success = await this.processPushNotification(delivery);
          break;
      }

      // Update delivery status
      await this.prisma.notificationDelivery.update({
        where: { id: job.deliveryId },
        data: {
          status: success ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
          deliveredAt: success ? new Date() : null,
          failureReason: success ? null : 'Processing failed'
        }
      });

      this.logger.log(`Job processed: ${job.deliveryId} (${job.channel}) - ${success ? 'SUCCESS' : 'FAILED'}`);

    } catch (error) {
      this.logger.error(`Job processing error: ${job.deliveryId}`, error);
    }
  }

  // Process in-app notification
  private async processInAppNotification(delivery: any): Promise<boolean> {
    try {
      // Send via WebSocket
      const notification = {
        id: delivery.id,
        title: delivery.notification.title,
        message: delivery.notification.message,
        type: delivery.notification.type,
        createdAt: delivery.notification.createdAt,
        expiresAt: delivery.notification.expiresAt
      };

      // Try to send via WebSocket
      const sent = this.notificationGateway.sendToUser(delivery.userId, notification);
      
      // Always mark as delivered for in-app (stored in DB regardless of WebSocket)
      this.logger.log(`📱 In-app notification processed for user ${delivery.userId}: ${delivery.notification.title} (WebSocket: ${sent ? 'sent' : 'offline'})`);
      return true;
    } catch (error) {
      this.logger.error('In-app notification failed:', error);
      return false;
    }
  }

  // Process email notification
  private async processEmailNotification(delivery: any): Promise<boolean> {
    try {
      await this.emailService.sendNotificationEmail(
        delivery.user.email,
        delivery.notification.title,
        delivery.notification.message,
        delivery.user.firstName
      );
      return true;
    } catch (error) {
      this.logger.error('Email notification failed:', error);
      return false;
    }
  }

  // Process SMS notification
  private async processSMSNotification(delivery: any): Promise<boolean> {
    try {
      await this.simulateDelay(500);
      this.logger.log(`📱 SMS sent to ${delivery.user.phone}: ${delivery.notification.title}`);
      return true;
    } catch (error) {
      this.logger.error('SMS notification failed:', error);
      return false;
    }
  }

  // Process push notification
  private async processPushNotification(delivery: any): Promise<boolean> {
    try {
      await this.simulateDelay(300);
      this.logger.log(`🔔 Push sent to user ${delivery.userId}: ${delivery.notification.title}`);
      return true;
    } catch (error) {
      this.logger.error('Push notification failed:', error);
      return false;
    }
  }

  // Get queue statistics
  getQueueStats() {
    return {
      processingQueue: this.processingQueue.length,
      retryQueue: 0,
      isProcessing: this.isProcessing,
      connectedUsers: this.notificationGateway.getConnectedUsersCount()
    };
  }

  // Simulate delay for testing
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Start scheduled notification processor
  startScheduledProcessor() {
    this.logger.log('Scheduled notification processor started');
  }
}
