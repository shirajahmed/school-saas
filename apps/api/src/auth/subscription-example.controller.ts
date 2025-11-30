import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { 
  RequireAdvancedReports, 
  RequireParentCommunication, 
  RequireMultiBranchManagement,
  CheckBranchLimit,
  CheckStudentLimit,
  CheckTeacherLimit,
  RequireFeature
} from './decorators/subscription.decorator';

@Controller('subscription-example')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
export class SubscriptionExampleController {

  // ✅ STARTER Plan: Basic features (no decorator needed)
  @Post('basic-attendance')
  async markBasicAttendance(@Body() attendanceData: any) {
    return { message: 'Basic attendance marked - available in all plans' };
  }

  // ❌ PROFESSIONAL+ Plan: Advanced reports
  @Post('advanced-reports')
  @RequireAdvancedReports()
  async generateAdvancedReport(@Body() reportData: any) {
    return { message: 'Advanced report generated - Professional+ only' };
  }

  // ❌ PROFESSIONAL+ Plan: Parent communication
  @Post('send-sms')
  @RequireParentCommunication()
  async sendSMSToParents(@Body() smsData: any) {
    return { message: 'SMS sent to parents - Professional+ only' };
  }

  // ❌ ENTERPRISE+ Plan: Multi-branch management
  @Post('manage-branches')
  @RequireMultiBranchManagement()
  async manageBranches(@Body() branchData: any) {
    return { message: 'Branch management - Enterprise+ only' };
  }

  // 🔢 LIMIT CHECK: Create branch (respects plan limits)
  @Post('create-branch')
  @CheckBranchLimit()
  async createBranch(@Body() branchData: any, @Request() req) {
    // STARTER: Max 1 branch
    // PROFESSIONAL: Max 3 branches  
    // ENTERPRISE: Max 10 branches
    return { message: 'Branch created within plan limits' };
  }

  // 🔢 LIMIT CHECK: Add student (respects plan limits)
  @Post('add-student')
  @CheckStudentLimit()
  async addStudent(@Body() studentData: any) {
    // STARTER: Max 100 students
    // PROFESSIONAL: Max 500 students
    // ENTERPRISE: Max 2000 students
    return { message: 'Student added within plan limits' };
  }

  // 🔢 LIMIT CHECK: Add teacher (respects plan limits)
  @Post('add-teacher')
  @CheckTeacherLimit()
  async addTeacher(@Body() teacherData: any) {
    // STARTER: Max 10 teachers
    // PROFESSIONAL: Max 50 teachers
    // ENTERPRISE: Max 200 teachers
    return { message: 'Teacher added within plan limits' };
  }

  // 🎯 CUSTOM FEATURE: API access
  @Get('api-data')
  @RequireFeature('api_access')
  async getAPIData() {
    return { message: 'API data - Enterprise+ only' };
  }

  // 🎯 CUSTOM FEATURE: White label
  @Post('customize-branding')
  @RequireFeature('white_label')
  async customizeBranding(@Body() brandingData: any) {
    return { message: 'Branding customized - Enterprise+ only' };
  }
}
