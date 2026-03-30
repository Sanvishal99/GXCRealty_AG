import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId → socketId (for direct DM delivery)
  private connectedUsers = new Map<string, string>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) { socket.disconnect(); return; }

      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const userId = payload.sub;

      this.connectedUsers.set(userId, socket.id);

      // Each user joins their own personal room for targeted broadcasts
      socket.join(`u:${userId}`);

      // Broadcast presence
      this.server.emit('userOnline', { userId });
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === socket.id) {
        this.connectedUsers.delete(userId);
        this.server.emit('userOffline', { userId });
        break;
      }
    }
  }

  /** Emit an event to a specific user by their userId (room-based) */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`u:${userId}`).emit(event, data);
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    client.emit('onlineUsers', Array.from(this.connectedUsers.keys()));
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    let senderId: string | undefined;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) { senderId = userId; break; }
    }
    if (!senderId) return;

    // Parse @mentions
    const handles = this.chatService.parseMentionHandles(payload.content);
    let mentionedUserIds: string[] = [];
    if (handles.length > 0) {
      const candidates = await this.prisma.user.findMany({
        where: {
          OR: handles.flatMap(h => [
            { email: h },
            { email: { startsWith: h + '@' } },
          ]),
        },
        select: { id: true, email: true },
      });
      mentionedUserIds = candidates.map(u => u.id);
    }

    const message = await this.chatService.saveMessage(
      senderId,
      payload.receiverId,
      payload.content,
      mentionedUserIds,
    );

    // Deliver to receiver
    this.emitToUser(payload.receiverId, 'newMessage', message);

    // Echo to sender
    client.emit('messageSent', message);

    // Notify mentioned 3rd parties
    const senderEmail = message.sender?.email || '';
    for (const mentionedId of mentionedUserIds) {
      if (mentionedId === senderId || mentionedId === payload.receiverId) continue;
      this.emitToUser(mentionedId, 'mentionNotification', {
        messageId: message.id,
        fromEmail: senderEmail,
        content: payload.content,
        createdAt: message.createdAt,
      });
    }
  }
}
