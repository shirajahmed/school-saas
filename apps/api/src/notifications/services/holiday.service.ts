import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HolidayService {
  constructor(private prisma: PrismaService) {}

  // Create holiday
  async createHoliday(data: {
    schoolId: string;
    branchId?: string;
    name: string;
    description?: string;
    date: Date;
    isRecurring?: boolean;
    recurrenceData?: any;
    affectsAttendance?: boolean;
    affectsTimetable?: boolean;
    createdBy: string;
  }) {
    const holiday = await this.prisma.holiday.create({
      data: {
        schoolId: data.schoolId,
        branchId: data.branchId,
        name: data.name,
        description: data.description,
        date: data.date,
        isRecurring: data.isRecurring || false,
        recurrenceData: data.recurrenceData,
        affectsAttendance: data.affectsAttendance !== false,
        affectsTimetable: data.affectsTimetable !== false,
        createdBy: data.createdBy
      }
    });

    // Log audit
    await this.logAudit('holiday', holiday.id, 'CREATE', null, holiday, data.createdBy, data.schoolId);

    return holiday;
  }

  // Get holidays
  async getHolidays(schoolId: string, branchId?: string, year?: number) {
    const where: any = {
      schoolId,
      isActive: true
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null } // Include school-wide holidays
      ];
    }

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      where.date = { gte: startOfYear, lte: endOfYear };
    }

    const holidays = await this.prisma.holiday.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: { date: 'asc' }
    });

    // Expand recurring holidays
    return this.expandRecurringHolidays(holidays, year);
  }

  // Expand recurring holidays
  private expandRecurringHolidays(holidays: any[], year?: number) {
    const expandedHolidays = [];
    const currentYear = year || new Date().getFullYear();

    for (const holiday of holidays) {
      if (!holiday.isRecurring) {
        expandedHolidays.push(holiday);
        continue;
      }

      // Generate yearly recurrences
      const originalDate = new Date(holiday.date);
      const recurringDate = new Date(currentYear, originalDate.getMonth(), originalDate.getDate());

      expandedHolidays.push({
        ...holiday,
        id: `${holiday.id}_${currentYear}`,
        date: recurringDate,
        isRecurring: true,
        originalHolidayId: holiday.id
      });
    }

    return expandedHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Check if date is holiday
  async isHoliday(schoolId: string, date: Date, branchId?: string): Promise<boolean> {
    const where: any = {
      schoolId,
      isActive: true
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    // Check exact date
    const exactHoliday = await this.prisma.holiday.findFirst({
      where: {
        ...where,
        date: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      }
    });

    if (exactHoliday) return true;

    // Check recurring holidays
    const recurringHolidays = await this.prisma.holiday.findMany({
      where: {
        ...where,
        isRecurring: true
      }
    });

    for (const holiday of recurringHolidays) {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getMonth() === date.getMonth() && 
          holidayDate.getDate() === date.getDate()) {
        return true;
      }
    }

    return false;
  }

  // Get holidays affecting attendance
  async getHolidaysAffectingAttendance(schoolId: string, startDate: Date, endDate: Date, branchId?: string) {
    const where: any = {
      schoolId,
      isActive: true,
      affectsAttendance: true,
      date: { gte: startDate, lte: endDate }
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });
  }

  // Get holidays affecting timetable
  async getHolidaysAffectingTimetable(schoolId: string, startDate: Date, endDate: Date, branchId?: string) {
    const where: any = {
      schoolId,
      isActive: true,
      affectsTimetable: true,
      date: { gte: startDate, lte: endDate }
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' }
    });
  }

  // Update holiday
  async updateHoliday(id: string, data: any, updatedBy: string) {
    const oldHoliday = await this.prisma.holiday.findUnique({ where: { id } });
    
    const updatedHoliday = await this.prisma.holiday.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    // Log audit
    await this.logAudit('holiday', id, 'UPDATE', oldHoliday, updatedHoliday, updatedBy, updatedHoliday.schoolId);

    return updatedHoliday;
  }

  // Delete holiday
  async deleteHoliday(id: string, deletedBy: string) {
    const holiday = await this.prisma.holiday.findUnique({ where: { id } });
    
    await this.prisma.holiday.update({
      where: { id },
      data: { isActive: false }
    });

    // Log audit
    await this.logAudit('holiday', id, 'DELETE', holiday, { isActive: false }, deletedBy, holiday.schoolId);

    return { message: 'Holiday deleted successfully' };
  }

  // Get upcoming holidays
  async getUpcomingHolidays(schoolId: string, branchId?: string, limit: number = 5) {
    const where: any = {
      schoolId,
      isActive: true,
      date: { gte: new Date() }
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    return this.prisma.holiday.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { date: 'asc' },
      take: limit
    });
  }

  // Import holidays from template
  async importHolidayTemplate(schoolId: string, templateName: string, year: number, createdBy: string) {
    const templates = this.getHolidayTemplates();
    const template = templates[templateName];

    if (!template) {
      throw new Error('Holiday template not found');
    }

    const holidays = [];
    for (const holiday of template) {
      const holidayDate = new Date(year, holiday.month - 1, holiday.day);
      
      holidays.push({
        schoolId,
        name: holiday.name,
        description: holiday.description,
        date: holidayDate,
        isRecurring: true,
        affectsAttendance: true,
        affectsTimetable: true,
        createdBy
      });
    }

    const createdHolidays = await this.prisma.holiday.createMany({
      data: holidays
    });

    return {
      message: `${createdHolidays.count} holidays imported successfully`,
      count: createdHolidays.count
    };
  }

  // Get holiday templates
  private getHolidayTemplates() {
    return {
      'us_federal': [
        { name: "New Year's Day", month: 1, day: 1, description: 'Federal Holiday' },
        { name: "Independence Day", month: 7, day: 4, description: 'Federal Holiday' },
        { name: "Christmas Day", month: 12, day: 25, description: 'Federal Holiday' }
      ],
      'indian_national': [
        { name: "Republic Day", month: 1, day: 26, description: 'National Holiday' },
        { name: "Independence Day", month: 8, day: 15, description: 'National Holiday' },
        { name: "Gandhi Jayanti", month: 10, day: 2, description: 'National Holiday' }
      ],
      'uk_bank': [
        { name: "New Year's Day", month: 1, day: 1, description: 'Bank Holiday' },
        { name: "Christmas Day", month: 12, day: 25, description: 'Bank Holiday' },
        { name: "Boxing Day", month: 12, day: 26, description: 'Bank Holiday' }
      ]
    };
  }

  // Log audit trail
  private async logAudit(entityType: string, entityId: string, action: string, oldValues: any, newValues: any, performedBy: string, schoolId: string) {
    await this.prisma.auditLog.create({
      data: {
        schoolId,
        entityType,
        entityId,
        action,
        oldValues,
        newValues,
        performedBy
      }
    });
  }
}
