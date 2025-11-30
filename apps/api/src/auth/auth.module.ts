import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { OnboardingController } from './onboarding.controller';
import { AuthService } from './services/auth.service';
import { OnboardingService } from './services/onboarding.service';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController, OnboardingController],
  providers: [
    AuthService,
    OnboardingService,
    EmailService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, OnboardingService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
