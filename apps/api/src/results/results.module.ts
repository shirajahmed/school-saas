import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ResultsController],
})
export class ResultsModule {}
