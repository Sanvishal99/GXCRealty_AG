import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, content: string) {
    return this.prisma.message.create({
      data: { senderId, receiverId, content },
      include: { sender: { select: { email: true, phone: true } } }
    });
  }

  async getMessages(userId1: string, userId2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
