import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { PermissionService } from './services/permission.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaService } from '../common/database/prisma.service';
import { TenantProvider } from '../common/tenant/tenant.provider';
import { TenantGuard } from '../common/tenant/tenant.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    TokenService,
    PermissionService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    PrismaService,
    TenantProvider,
  ],
  exports: [
    AuthService,
    TokenService,
    PermissionService,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}
