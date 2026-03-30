import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, content: string, mentionedUserIds?: string[]) {
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        ...(mentionedUserIds && mentionedUserIds.length > 0 ? { mentions: mentionedUserIds } : {}),
      },
      include: {
        sender: { select: { id: true, email: true, role: true } },
      },
    });
  }

  async getMessages(userId1: string, userId2: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: {
        sender: { select: { id: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Parse @handle patterns from message content, return handles (email prefix or full email)
  parseMentionHandles(content: string): string[] {
    const regex = /@([\w.+-]+@[\w.-]+\.\w+|[\w.+-]+)/g;
    const handles: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      handles.push(match[1].toLowerCase());
    }
    return [...new Set(handles)];
  }
}
