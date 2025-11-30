import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
