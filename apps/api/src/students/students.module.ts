import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [StudentsController],
})
export class StudentsModule {}
