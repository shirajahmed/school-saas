import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  schoolId: string;
  branchId?: string;
  userId: string;
}

@Injectable()
export class TenantProvider {
  private readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  run<T>(context: TenantContext, callback: () => T): T {
    return this.asyncLocalStorage.run(context, callback);
  }

  getTenantContext(): TenantContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  getSchoolId(): string {
    const context = this.getTenantContext();
    if (!context?.schoolId) {
      throw new Error('School ID not found in tenant context');
    }
    return context.schoolId;
  }

  getBranchId(): string | undefined {
    return this.getTenantContext()?.branchId;
  }

  getUserId(): string {
    const context = this.getTenantContext();
    if (!context?.userId) {
      throw new Error('User ID not found in tenant context');
    }
    return context.userId;
  }
}
