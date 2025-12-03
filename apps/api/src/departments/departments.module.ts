import { Module } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [DepartmentsController],
})
export class DepartmentsModule {}
