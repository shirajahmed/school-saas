import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { OnboardingController } from './onboarding.controller';
import { AdminController } from './admin.controller';
import { SubscriptionExampleController } from './subscription-example.controller';
import { AuthService } from './services/auth.service';
import { OnboardingService } from './services/onboarding.service';
import { PermissionService } from './services/permission.service';
import { SubscriptionService } from './services/subscription.service';
import { EmailService } from './services/email.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionGuard } from './guards/permission.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
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
  controllers: [AuthController, OnboardingController, AdminController, SubscriptionExampleController],
  providers: [
    AuthService,
    OnboardingService,
    PermissionService,
    SubscriptionService,
    EmailService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    PermissionGuard,
    SubscriptionGuard,
  ],
  exports: [AuthService, OnboardingService, PermissionService, SubscriptionService, EmailService, JwtAuthGuard, RolesGuard, PermissionGuard, SubscriptionGuard],
})
export class AuthModule {}
