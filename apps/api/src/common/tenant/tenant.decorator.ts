import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from './tenant.provider';

export const Tenant = createParamDecorator(
  (data: keyof TenantContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantContext;
    
    if (!tenant) {
      throw new Error('Tenant context not found');
    }
    
    return data ? tenant[data] : tenant;
  },
);
