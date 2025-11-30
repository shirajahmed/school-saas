import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ExamsController],
})
export class ExamsModule {}
