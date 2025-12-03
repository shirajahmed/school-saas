import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { EventService } from './services/event.service';
import { HolidayService } from './services/holiday.service';
import { QueueService } from './services/queue.service';
import { NotificationGateway } from './gateways/notification.gateway';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EventService,
    HolidayService,
    QueueService,
    NotificationGateway,
  ],
  exports: [
    NotificationService,
    EventService,
    HolidayService,
    QueueService,
    NotificationGateway,
  ],
})
export class NotificationsModule {
  constructor(private queueService: QueueService) {
    // Start scheduled notification processor
    this.queueService.startScheduledProcessor();
  }
}
