import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TenantProvider } from './tenant.provider';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantProvider: TenantProvider) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const tenantContext = {
      schoolId: user.schoolId,
      branchId: user.branchId,
      userId: user.userId,
    };

    request.tenant = tenantContext;
    return true;
  }
}
