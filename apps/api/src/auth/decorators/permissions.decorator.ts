import { SetMetadata } from '@nestjs/common';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { PERMISSIONS_KEY, RequiredPermission } from '../guards/permission.guard';

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Helper functions for common permission patterns
export const CanManage = (resource: PermissionResource) =>
  RequirePermissions({ resource, action: PermissionAction.MANAGE });

export const CanCreate = (resource: PermissionResource) =>
  RequirePermissions({ resource, action: PermissionAction.CREATE });

export const CanRead = (resource: PermissionResource) =>
  RequirePermissions({ resource, action: PermissionAction.READ });

export const CanUpdate = (resource: PermissionResource) =>
  RequirePermissions({ resource, action: PermissionAction.UPDATE });

export const CanDelete = (resource: PermissionResource) =>
  RequirePermissions({ resource, action: PermissionAction.DELETE });

// Multiple permissions
export const CanCreateOrUpdate = (resource: PermissionResource) =>
  RequirePermissions(
    { resource, action: PermissionAction.CREATE },
    { resource, action: PermissionAction.UPDATE }
  );
