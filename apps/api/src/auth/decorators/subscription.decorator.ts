import { SetMetadata } from '@nestjs/common';
import { SUBSCRIPTION_FEATURE_KEY, SUBSCRIPTION_LIMIT_KEY, SubscriptionFeature, SubscriptionLimit } from '../guards/subscription.guard';

// Feature requirement decorators
export const RequireFeature = (feature: string, required: boolean = true) =>
  SetMetadata(SUBSCRIPTION_FEATURE_KEY, { feature, required } as SubscriptionFeature);

export const RequireLimit = (resource: string, action: string = 'CREATE') =>
  SetMetadata(SUBSCRIPTION_LIMIT_KEY, { resource, action } as SubscriptionLimit);

// Common feature decorators
export const RequireAdvancedReports = () => RequireFeature('advanced_reports');
export const RequireParentCommunication = () => RequireFeature('parent_communication');
export const RequireExamManagement = () => RequireFeature('exam_management');
export const RequireTimetableManagement = () => RequireFeature('timetable_management');
export const RequireSMSNotifications = () => RequireFeature('sms_notifications');
export const RequireBulkOperations = () => RequireFeature('bulk_operations');
export const RequireMultiBranchManagement = () => RequireFeature('multi_branch_management');
export const RequireAPIAccess = () => RequireFeature('api_access');
export const RequireCustomReports = () => RequireFeature('custom_reports');
export const RequireAdvancedAnalytics = () => RequireFeature('advanced_analytics');
export const RequireWhiteLabel = () => RequireFeature('white_label');
export const RequireIntegrations = () => RequireFeature('integrations');

// Common limit decorators
export const CheckBranchLimit = () => RequireLimit('BRANCHES');
export const CheckStudentLimit = () => RequireLimit('STUDENTS');
export const CheckTeacherLimit = () => RequireLimit('TEACHERS');
export const CheckUserLimit = () => RequireLimit('USERS');
export const CheckClassLimit = () => RequireLimit('CLASSES');
export const CheckExamLimit = () => RequireLimit('EXAMS');
