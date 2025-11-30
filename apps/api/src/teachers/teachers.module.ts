import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [TeachersController],
})
export class TeachersModule {}
