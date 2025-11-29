import { Global, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { TenantProvider } from './tenant/tenant.provider';

@Global()
@Module({
  providers: [PrismaService, TenantProvider],
  exports: [PrismaService, TenantProvider],
})
export class CommonModule {}
