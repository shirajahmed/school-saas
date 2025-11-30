import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantProvider } from '../../common/tenant/tenant.provider';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tenantProvider: TenantProvider) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or missing authentication token');
    }

    // Set tenant context with correct property names
    const tenantContext = {
      schoolId: user.schoolId,
      branchId: user.branchId,
      userId: user.sub, // JWT payload uses 'sub' for user ID
    };

    // Set tenant context and return user
    this.tenantProvider.run(tenantContext, () => {});
    return user;
  }
}
