import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/database/prisma.service';
import { TenantProvider } from '../../common/tenant/tenant.provider';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  schoolId: string;
  branchId?: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantProvider: TenantProvider,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, schoolId: true, branchId: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Set tenant context for multi-tenancy
    this.tenantProvider.run({
      schoolId: user.schoolId,
      branchId: user.branchId,
      userId: user.id,
    }, () => {});

    return payload;
  }
}
