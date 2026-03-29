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

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3001', credentials: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // Maps userId -> socketId

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(socket: Socket) {
    try {
      // Expect token to be passed heavily from client Handshake
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        socket.disconnect();
        return;
      }
      
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      const userId = payload.sub;
      
      this.connectedUsers.set(userId, socket.id);
      console.log(`User online: ${userId} (${socket.id})`);
    } catch (err) {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === socket.id) {
        this.connectedUsers.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    let senderId: string;
    
    // Identify sender by socket connection mapping
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) senderId = userId;
    }

    if (!senderId) return;

    // Securely commit message to DB via the Service
    const message = await this.chatService.saveMessage(senderId, payload.receiverId, payload.content);

    // Realtime Delivery if receiver is online!
    const receiverSocketId = this.connectedUsers.get(payload.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', message);
    }
    
    // Echo back state to sender
    client.emit('messageSent', message);
  }
}
