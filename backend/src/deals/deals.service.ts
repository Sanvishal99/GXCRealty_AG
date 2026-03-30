import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { ChatGateway } from '../chat/chat.gateway';
import { NetworkService } from '../network/network.service';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private chatGateway: ChatGateway,
    private networkService: NetworkService,
  ) {}

  async closeDeal(propertyId: string, agentId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status === PropertyStatus.SOLD) {
      throw new BadRequestException('Property has already been sold');
    }
    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new BadRequestException('Property is not available for deals');
    }

    const salePrice = property.price;
    if (!salePrice || salePrice <= 0) {
      throw new BadRequestException('Property does not have a sale price set. Ask the company to update the listing.');
    }
    const totalCommissionRate = (property.commissionPoolPct ?? 2) / 100;

    const deal = await this.prisma.$transaction(async (tx) => {
      const newDeal = await tx.deal.create({
        data: { propertyId, agentId, salePrice, totalCommission: totalCommissionRate },
      });
      await tx.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.SOLD },
      });
      return newDeal;
    });

    const distribution = await this.commissionService.distributeCommission(
      deal.id,
      agentId,
      property.companyId,
      salePrice,
      totalCommissionRate,
    );

    // Notify upline of the deal close
    try {
      const agent = await this.prisma.user.findUnique({
        where: { id: agentId },
        select: { email: true },
      });
      const uplineIds = await this.networkService.getUplineChain(agentId);
      for (const uplineId of uplineIds) {
        this.chatGateway.emitToUser(uplineId, 'networkActivity', {
          type: 'DEAL_CLOSED',
          agentId,
          agentEmail: agent?.email ?? agentId,
          title: 'Deal closed 🎉',
          detail: `${(agent?.email ?? agentId).split('@')[0]} closed a deal on "${property.title}" for ₹${(salePrice / 100000).toFixed(1)}L`,
          timestamp: deal.createdAt,
          meta: { dealId: deal.id, propertyTitle: property.title, salePrice },
        });
      }
    } catch {
      // Non-blocking
    }

    return { deal, distribution, salePrice, commissionPoolPct: property.commissionPoolPct ?? 2 };
  }

  async getDeals(filters?: { agentId?: string; companyId?: string }) {
    return this.prisma.deal.findMany({
      where: {
        ...(filters?.agentId && { agentId: filters.agentId }),
        ...(filters?.companyId && { property: { companyId: filters.companyId } }),
      },
      include: {
        property: { select: { id: true, title: true, city: true, companyId: true } },
        agent: { select: { id: true, email: true } },
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
