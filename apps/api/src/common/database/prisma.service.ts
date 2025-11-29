import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantProvider } from '../tenant/tenant.provider';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantProvider: TenantProvider) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.setupTenantMiddleware();
  }

  private setupTenantMiddleware() {
    const tenantModels = [
      'user', 'student', 'teacher', 'class', 'section', 
      'attendance', 'exam', 'result', 'branch'
    ];

    this.$use(async (params, next) => {
      const tenantContext = this.tenantProvider.getTenantContext();
      
      if (!tenantContext || !tenantModels.includes(params.model)) {
        return next(params);
      }

      // Auto-inject schoolId for create operations
      if (params.action === 'create') {
        if (params.args.data) {
          params.args.data.schoolId = tenantContext.schoolId;
          
          // Auto-inject branchId if available and model supports it
          if (tenantContext.branchId && params.model !== ('user' as any)) {
            params.args.data.branchId = tenantContext.branchId;
          }
        }
      }

      // Auto-inject schoolId filter for read/update/delete operations
      if (['findFirst', 'findMany', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
        if (!params.args) {
          params.args = {};
        }
        if (!params.args.where) {
          params.args.where = {};
        }
        
        params.args.where.schoolId = tenantContext.schoolId;
        
        // Add branchId filter if available and model supports it
        if (tenantContext.branchId && params.model !== ('user' as any) && params.model !== ('school' as any)) {
          params.args.where.branchId = tenantContext.branchId;
        }
      }

      return next(params);
    });
  }
}
