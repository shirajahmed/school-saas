import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import { EventType, RecurrenceType } from '@prisma/client';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  // Create event
  async createEvent(data: {
    schoolId: string;
    branchId?: string;
    title: string;
    description?: string;
    type: EventType;
    startDate: Date;
    endDate: Date;
    isAllDay?: boolean;
    location?: string;
    recurrenceType?: RecurrenceType;
    recurrenceEnd?: Date;
    recurrenceData?: any;
    createdBy: string;
  }) {
    const event = await this.prisma.event.create({
      data: {
        schoolId: data.schoolId,
        branchId: data.branchId,
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay || false,
        location: data.location,
        recurrenceType: data.recurrenceType || RecurrenceType.NONE,
        recurrenceEnd: data.recurrenceEnd,
        recurrenceData: data.recurrenceData,
        createdBy: data.createdBy
      }
    });

    // Log audit
    await this.logAudit('event', event.id, 'CREATE', null, event, data.createdBy, data.schoolId);

    return event;
  }

  // Get events for calendar
  async getEvents(schoolId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      schoolId,
      isActive: true
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null } // Include school-wide events
      ];
    }

    if (startDate && endDate) {
      where.OR = [
        // Events that start within the range
        {
          startDate: { gte: startDate, lte: endDate }
        },
        // Events that end within the range
        {
          endDate: { gte: startDate, lte: endDate }
        },
        // Events that span the entire range
        {
          startDate: { lte: startDate },
          endDate: { gte: endDate }
        }
      ];
    }

    const events = await this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        },
        branch: {
          select: { name: true }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    // Expand recurring events
    return this.expandRecurringEvents(events, startDate, endDate);
  }

  // Expand recurring events into individual occurrences
  private expandRecurringEvents(events: any[], startDate?: Date, endDate?: Date) {
    const expandedEvents = [];

    for (const event of events) {
      if (event.recurrenceType === RecurrenceType.NONE) {
        expandedEvents.push(event);
        continue;
      }

      // Generate recurring occurrences
      const occurrences = this.generateRecurrences(event, startDate, endDate);
      expandedEvents.push(...occurrences);
    }

    return expandedEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  // Generate recurring event occurrences
  private generateRecurrences(event: any, rangeStart?: Date, rangeEnd?: Date) {
    const occurrences = [];
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const duration = eventEnd.getTime() - eventStart.getTime();

    let currentDate = new Date(eventStart);
    const recurrenceEnd = event.recurrenceEnd ? new Date(event.recurrenceEnd) : 
                         (rangeEnd ? new Date(rangeEnd.getTime() + 365 * 24 * 60 * 60 * 1000) : 
                          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    while (currentDate <= recurrenceEnd) {
      // Check if this occurrence falls within the requested range
      if (!rangeStart || !rangeEnd || 
          (currentDate >= rangeStart && currentDate <= rangeEnd)) {
        
        occurrences.push({
          ...event,
          id: `${event.id}_${currentDate.toISOString()}`,
          startDate: new Date(currentDate),
          endDate: new Date(currentDate.getTime() + duration),
          isRecurring: true,
          originalEventId: event.id
        });
      }

      // Move to next occurrence
      switch (event.recurrenceType) {
        case RecurrenceType.DAILY:
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case RecurrenceType.WEEKLY:
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case RecurrenceType.MONTHLY:
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case RecurrenceType.YEARLY:
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          break;
      }

      // Safety check to prevent infinite loops
      if (occurrences.length > 1000) break;
    }

    return occurrences;
  }

  // Update event
  async updateEvent(id: string, data: any, updatedBy: string) {
    const oldEvent = await this.prisma.event.findUnique({ where: { id } });
    
    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    // Log audit
    await this.logAudit('event', id, 'UPDATE', oldEvent, updatedEvent, updatedBy, updatedEvent.schoolId);

    return updatedEvent;
  }

  // Delete event
  async deleteEvent(id: string, deletedBy: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    
    await this.prisma.event.update({
      where: { id },
      data: { isActive: false }
    });

    // Log audit
    await this.logAudit('event', id, 'DELETE', event, { isActive: false }, deletedBy, event.schoolId);

    return { message: 'Event deleted successfully' };
  }

  // Get events by type
  async getEventsByType(schoolId: string, type: EventType, branchId?: string) {
    const where: any = {
      schoolId,
      type,
      isActive: true
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    return this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { startDate: 'asc' }
    });
  }

  // Export calendar (iCal format)
  async exportCalendar(schoolId: string, branchId?: string, startDate?: Date, endDate?: Date) {
    const events = await this.getEvents(schoolId, branchId, startDate, endDate);
    
    // Generate iCal format
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//School Management System//EN',
      'CALSCALE:GREGORIAN'
    ];

    for (const event of events) {
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@schoolsystem.com`,
        `DTSTART:${this.formatDateForICal(event.startDate)}`,
        `DTEND:${this.formatDateForICal(event.endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        `CREATED:${this.formatDateForICal(event.createdAt)}`,
        'END:VEVENT'
      );
    }

    icalContent.push('END:VCALENDAR');

    return icalContent.join('\r\n');
  }

  // Format date for iCal
  private formatDateForICal(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  // Get upcoming events
  async getUpcomingEvents(schoolId: string, branchId?: string, limit: number = 10) {
    const where: any = {
      schoolId,
      isActive: true,
      startDate: { gte: new Date() }
    };

    if (branchId) {
      where.OR = [
        { branchId },
        { branchId: null }
      ];
    }

    return this.prisma.event.findMany({
      where,
      include: {
        creator: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { startDate: 'asc' },
      take: limit
    });
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
