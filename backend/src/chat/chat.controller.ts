import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
  ) {}

  // Get all users this user has exchanged messages with (contacts)
  @Get('contacts')
  async getContacts(@Request() req) {
    const userId = req.user.id;
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, email: true, role: true } },
        receiver: { select: { id: true, email: true, role: true } },
      },
    });

    // Build unique contact list with last message
    const contactMap = new Map<string, any>();
    for (const msg of messages) {
      const other = msg.senderId === userId ? msg.receiver : msg.sender;
      if (!contactMap.has(other.id)) {
        contactMap.set(other.id, { user: other, lastMessage: msg });
      }
    }

    // Also include all users (network) even without messages
    const allUsers = await this.prisma.user.findMany({
      where: { id: { not: userId } },
      select: { id: true, email: true, role: true },
      take: 50,
    });

    for (const u of allUsers) {
      if (!contactMap.has(u.id)) {
        contactMap.set(u.id, { user: u, lastMessage: null });
      }
    }

    return Array.from(contactMap.values());
  }

  // Get message history with a specific user
  @Get('history/:userId')
  async getHistory(@Request() req, @Param('userId') userId: string) {
    return this.chatService.getMessages(req.user.id, userId);
  }
}
