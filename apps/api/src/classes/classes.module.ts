import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ClassesController],
})
export class ClassesModule {}
