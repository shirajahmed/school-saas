import { Module } from '@nestjs/common';
import { SectionsController } from './sections.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [SectionsController],
})
export class SectionsModule {}
