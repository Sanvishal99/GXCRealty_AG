import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NetworkService } from '../network/network.service';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly prisma: PrismaService,
    private readonly networkService: NetworkService,
  ) {}

  /**
   * Returns contacts the current user is allowed to chat with.
   *
   * Rules:
   *  - ADMIN:   all active users
   *  - AGENT:   (1) full upline chain (up to 5 levels) + all downline team members
   *             (2) companies with at least one APPROVED visit requested by this agent
   *  - COMPANY: agents with at least one APPROVED visit on this company's properties
   *
   * Each contact includes connectionType: 'network' | 'visit' | null
   */
  @Get('contacts')
  async getContacts(@Request() req) {
    const userId = req.user.id || req.user.sub;
    const role: string = req.user.role;

    // Maps contact userId → connectionType
    const contactTypeMap = new Map<string, 'network' | 'visit'>();

    if (role === 'ADMIN') {
      const allUsers = await this.prisma.user.findMany({
        where: { id: { not: userId }, status: 'ACTIVE' },
        select: { id: true },
      });
      for (const u of allUsers) contactTypeMap.set(u.id, 'network');

    } else if (role === 'AGENT') {
      // 1. Network team: upline chain + all downline
      const [uplineIds, downlineMap] = await Promise.all([
        this.networkService.getUplineChain(userId, 5),
        this.networkService.getAllDownlineIds(userId, 5),
      ]);
      for (const id of uplineIds) contactTypeMap.set(id, 'network');
      for (const id of downlineMap.keys()) contactTypeMap.set(id, 'network');

      // 2. Visit-gated companies
      const approvedVisits = await this.prisma.visit.findMany({
        where: { agentId: userId, status: 'APPROVED' },
        include: { property: { select: { companyId: true } } },
      });
      for (const v of approvedVisits) {
        if (!contactTypeMap.has(v.property.companyId)) {
          contactTypeMap.set(v.property.companyId, 'visit');
        }
      }

    } else if (role === 'COMPANY') {
      const approvedVisits = await this.prisma.visit.findMany({
        where: { property: { companyId: userId }, status: 'APPROVED' },
        select: { agentId: true },
      });
      for (const v of approvedVisits) contactTypeMap.set(v.agentId, 'visit');
    }

    const allowedUserIds = Array.from(contactTypeMap.keys());
    if (allowedUserIds.length === 0) return [];

    // Fetch users
    const users = await this.prisma.user.findMany({
      where: { id: { in: allowedUserIds } },
      select: { id: true, email: true, role: true, phone: true },
    });

    // Last message per contact
    const allMessages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: allowedUserIds } },
          { senderId: { in: allowedUserIds }, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const lastMessageMap = new Map<string, any>();
    for (const msg of allMessages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!lastMessageMap.has(otherId)) lastMessageMap.set(otherId, msg);
    }

    // Visit context for AGENT ↔ COMPANY channels
    const visitContextMap = new Map<string, { propertyTitle: string; propertyId: string; visitId: string }>();

    if (role === 'AGENT') {
      const visits = await this.prisma.visit.findMany({
        where: { agentId: userId, status: 'APPROVED' },
        include: { property: { select: { companyId: true, title: true, id: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      for (const v of visits) {
        if (!visitContextMap.has(v.property.companyId)) {
          visitContextMap.set(v.property.companyId, {
            propertyTitle: v.property.title,
            propertyId: v.property.id,
            visitId: v.id,
          });
        }
      }
    } else if (role === 'COMPANY') {
      const visits = await this.prisma.visit.findMany({
        where: { property: { companyId: userId }, status: 'APPROVED' },
        include: { property: { select: { title: true, id: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      for (const v of visits) {
        if (!visitContextMap.has(v.agentId)) {
          visitContextMap.set(v.agentId, {
            propertyTitle: v.property.title,
            propertyId: v.property.id,
            visitId: v.id,
          });
        }
      }
    }

    // Sort: contacts with recent messages first, then rest
    const withMsg = users
      .filter(u => lastMessageMap.has(u.id))
      .sort((a, b) =>
        new Date(lastMessageMap.get(b.id).createdAt).getTime() -
        new Date(lastMessageMap.get(a.id).createdAt).getTime()
      );
    const withoutMsg = users.filter(u => !lastMessageMap.has(u.id));

    return [...withMsg, ...withoutMsg].map(u => ({
      user: u,
      lastMessage: lastMessageMap.get(u.id) || null,
      context: visitContextMap.get(u.id) || null,
      connectionType: contactTypeMap.get(u.id) || null,
    }));
  }

  @Get('history/:userId')
  async getHistory(@Request() req, @Param('userId') userId: string) {
    return this.chatService.getMessages(req.user.id || req.user.sub, userId);
  }
}
