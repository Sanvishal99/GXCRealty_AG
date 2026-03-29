import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.lead.create({
      data: { ...data, agentId },
      include: LEAD_INCLUDE,
    });
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
    return this.prisma.lead.update({
      where: { id: leadId },
      data,
      include: LEAD_INCLUDE,
    });
  }

  async deleteLead(leadId: string, agentId: string, role: Role) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (role !== Role.ADMIN && lead.agentId !== agentId) throw new ForbiddenException();
    return this.prisma.lead.delete({ where: { id: leadId } });
  }

  // ── Interested Properties ─────────────────────────────────────────────────

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

  // ── Schedule Visit from Lead ──────────────────────────────────────────────

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

    // Auto-advance lead stage if still in early stages
    if (lead.stage === LeadStage.NEW || lead.stage === LeadStage.CONTACTED) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { stage: LeadStage.VISIT_SCHEDULED },
      });
    }

    return visit;
  }
}
