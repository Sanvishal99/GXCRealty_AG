import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NetworkService } from '../network/network.service';
import { LeadStage, Role, VisitStatus } from '@prisma/client';

const LEAD_INCLUDE = {
  property: { select: { id: true, title: true, city: true, projectType: true } },
  agent: { select: { id: true, email: true, phone: true } },
  interestedProperties: {
    include: {
      property: { select: { id: true, title: true, city: true, projectType: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  leadVisits: {
    select: {
      id: true, scheduledAt: true, status: true, propertyId: true,
      property: { select: { id: true, title: true } },
    },
    orderBy: { scheduledAt: 'desc' as const },
    take: 5,
  },
};

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
    private networkService: NetworkService,
  ) {}

  private async notifyUpline(agentId: string, event: string, payload: any) {
    try {
      const uplineIds = await this.networkService.getUplineChain(agentId);
      for (const uplineId of uplineIds) {
        this.chatGateway.emitToUser(uplineId, 'networkActivity', payload);
      }
    } catch {
      // Non-blocking — don't fail lead operations if notification fails
    }
  }

  async getLeads(userId: string, role: Role) {
    const where = role === Role.ADMIN ? {} : { agentId: userId };
    return this.prisma.lead.findMany({
      where,
      include: LEAD_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createLead(
    agentId: string,
    data: {
      buyerName: string;
      buyerPhone: string;
      buyerEmail?: string;
      budget?: number;
      preferredCity?: string;
      preferredType?: string;
      notes?: string;
      propertyId?: string;
    },
  ) {
    const lead = await this.prisma.lead.create({
      data: { ...data, agentId },
      include: LEAD_INCLUDE,
    });

    // Notify upline
    await this.notifyUpline(agentId, 'networkActivity', {
      type: 'LEAD_CREATED',
      agentId,
      agentEmail: lead.agent.email,
      title: 'New lead added',
      detail: `${lead.agent.email.split('@')[0]} added ${data.buyerName} as a new lead`,
      timestamp: lead.createdAt,
      meta: { leadId: lead.id, buyerName: data.buyerName, stage: lead.stage },
    });

    return lead;
  }

  async updateLead(
    leadId: string,
    agentId: string,
    role: Role,
    data: Partial<{
      buyerName: string;
      buyerPhone: string;
      buyerEmail: string;
      budget: number;
      preferredCity: string;
      preferredType: string;
      notes: string;
      stage: LeadStage;
      propertyId: string;
      closedReason: string;
      closedPrice: number;
    }>,
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data,
      include: LEAD_INCLUDE,
    });

    // Notify upline only on stage changes
    if (data.stage && data.stage !== lead.stage) {
      await this.notifyUpline(lead.agentId, 'networkActivity', {
        type: 'LEAD_STAGE_CHANGED',
        agentId: lead.agentId,
        agentEmail: updated.agent.email,
        title: 'Lead progressed',
        detail: `${updated.agent.email.split('@')[0]}'s lead "${updated.buyerName}" → ${data.stage.replace(/_/g, ' ')}`,
        timestamp: updated.updatedAt,
        meta: { leadId, buyerName: updated.buyerName, oldStage: lead.stage, newStage: data.stage },
      });
    }

    return updated;
  }

  async deleteLead(leadId: string, agentId: string, role: Role) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();
    return this.prisma.lead.delete({ where: { id: leadId } });
  }

  async addInterestedProperty(leadId: string, agentId: string, role: Role, propertyId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();

    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await this.prisma.leadInterestedProperty.findFirst({ where: { leadId, propertyId } });
    if (existing) return existing;

    return this.prisma.leadInterestedProperty.create({
      data: { leadId, propertyId },
      include: {
        property: { select: { id: true, title: true, city: true, projectType: true } },
      },
    });
  }

  async removeInterestedProperty(leadId: string, agentId: string, role: Role, propertyId: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();
    await this.prisma.leadInterestedProperty.deleteMany({ where: { leadId, propertyId } });
  }

  async scheduleVisitForLead(
    leadId: string,
    agentId: string,
    role: Role,
    data: {
      propertyId: string;
      scheduledAt: string;
      clientName?: string;
      clientPhone?: string;
    },
  ) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();

    const property = await this.prisma.property.findUnique({ where: { id: data.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt < new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    const visit = await this.prisma.visit.create({
      data: {
        propertyId: data.propertyId,
        agentId,
        leadId,
        clientName: data.clientName || lead.buyerName,
        clientPhone: data.clientPhone || lead.buyerPhone,
        scheduledAt,
        status: VisitStatus.PENDING,
      },
      include: { property: { select: { id: true, title: true, city: true } } },
    });

    if (lead.stage === LeadStage.NEW || lead.stage === LeadStage.CONTACTED) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { stage: LeadStage.VISIT_SCHEDULED },
      });
    }

    return visit;
  }
}
