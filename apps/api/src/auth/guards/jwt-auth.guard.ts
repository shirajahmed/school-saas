import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantProvider } from '../../common/tenant/tenant.provider';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly tenantProvider: TenantProvider) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new Error('Unauthorized');
    }

    // Set tenant context
    const tenantContext = {
      schoolId: user.schoolId,
      branchId: user.branchId,
      userId: user.userId,
    };

    return this.tenantProvider.run(tenantContext, () => user);
  }
}
