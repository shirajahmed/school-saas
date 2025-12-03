import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/database/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  schoolId?: string;
  role?: string;
}

@WebSocketGateway({
  cors: {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('WebSocket connection rejected: No token provided');
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, schoolId: true, role: true, status: true, firstName: true, lastName: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        this.logger.warn(`WebSocket connection rejected: Invalid user ${payload.sub}`);
        client.disconnect();
        return;
      }

      // Attach user info to socket
      client.userId = user.id;
      client.schoolId = user.schoolId;
      client.role = user.role;

      // Store connection
      this.connectedUsers.set(user.id, client);

      // Join user to their school room
      if (user.schoolId) {
        client.join(`school:${user.schoolId}`);
      }

      // Join user to their role room
      client.join(`role:${user.role}`);

      // Join user to their personal room
      client.join(`user:${user.id}`);

      this.logger.log(`✅ User ${user.firstName} ${user.lastName} (${user.id}) connected to notifications`);

      // Send connection confirmation
      client.emit('connected', {
        message: 'Connected to notification service',
        userId: user.id,
        connectedAt: new Date().toISOString()
      });

      // Send unread count
      await this.sendUnreadCount(client);

    } catch (error) {
      this.logger.error('WebSocket connection authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`❌ User ${client.userId} disconnected from notifications`);
    }
  }

  // Subscribe to personal notifications
  @SubscribeMessage('subscribe:personal')
  handleSubscribePersonal(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.userId) {
      client.join(`user:${client.userId}`);
      client.emit('subscribed', { type: 'personal', userId: client.userId });
      this.logger.log(`📱 User ${client.userId} subscribed to personal notifications`);
    }
  }

  // Subscribe to school notifications
  @SubscribeMessage('subscribe:school')
  handleSubscribeSchool(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.schoolId) {
      client.join(`school:${client.schoolId}`);
      client.emit('subscribed', { type: 'school', schoolId: client.schoolId });
      this.logger.log(`🏫 User ${client.userId} subscribed to school notifications`);
    }
  }

  // Mark notification as read
  @SubscribeMessage('mark:read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deliveryId: string }
  ) {
    if (!client.userId) return;

    try {
      await this.prisma.notificationDelivery.update({
        where: {
          id: data.deliveryId,
          userId: client.userId
        },
        data: {
          metadata: { readAt: new Date() }
        }
      });

      client.emit('marked:read', { deliveryId: data.deliveryId });
      
      // Send updated unread count
      await this.sendUnreadCount(client);
      
      this.logger.log(`✅ User ${client.userId} marked notification ${data.deliveryId} as read`);
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notification as read' });
      this.logger.error(`❌ Failed to mark notification as read for user ${client.userId}:`, error.message);
    }
  }

  // Get unread count
  @SubscribeMessage('get:unread-count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    await this.sendUnreadCount(client);
  }

  // Send unread count to client
  private async sendUnreadCount(client: AuthenticatedSocket) {
    if (!client.userId) return;

    try {
      const count = await this.prisma.notificationDelivery.count({
        where: {
          userId: client.userId,
          channel: 'IN_APP',
          status: 'DELIVERED',
          OR: [
            { metadata: { equals: null } },
            { metadata: { path: ['readAt'], equals: null } }
          ]
        }
      });

      client.emit('unread:count', { count });
    } catch (error) {
      client.emit('error', { message: 'Failed to get unread count' });
      this.logger.error(`❌ Failed to get unread count for user ${client.userId}:`, error.message);
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, notification: any): boolean {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('notification', {
        ...notification,
        timestamp: new Date().toISOString()
      });
      this.logger.log(`📱 Real-time notification sent to user ${userId}: ${notification.title}`);
      return true;
    }
    this.logger.warn(`📱 User ${userId} not connected for real-time notification`);
    return false;
  }

  // Send notification to all users in school
  sendToSchool(schoolId: string, notification: any) {
    this.server.to(`school:${schoolId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    this.logger.log(`🏫 School-wide notification sent to ${schoolId}: ${notification.title}`);
  }

  // Send notification to specific role
  sendToRole(role: string, notification: any) {
    this.server.to(`role:${role}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
    this.logger.log(`👥 Role-based notification sent to ${role}: ${notification.title}`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], notification: any): number {
    let sentCount = 0;
    userIds.forEach(userId => {
      if (this.sendToUser(userId, notification)) {
        sentCount++;
      }
    });
    this.logger.log(`📤 Notification sent to ${sentCount}/${userIds.length} connected users`);
    return sentCount;
  }

  // Broadcast system announcement
  broadcastAnnouncement(announcement: any) {
    this.server.emit('announcement', {
      ...announcement,
      timestamp: new Date().toISOString()
    });
    this.logger.log(`📢 System announcement broadcasted: ${announcement.title}`);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users for school
  getSchoolConnectedUsers(schoolId: string): string[] {
    const users = [];
    this.connectedUsers.forEach((client, userId) => {
      if (client.schoolId === schoolId) {
        users.push(userId);
      }
    });
    return users;
  }

  // Send typing indicator (bonus feature)
  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { room: string }) {
    if (client.userId) {
      client.to(data.room).emit('user:typing', { userId: client.userId, typing: true });
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() data: { room: string }) {
    if (client.userId) {
      client.to(data.room).emit('user:typing', { userId: client.userId, typing: false });
    }
  }
}
