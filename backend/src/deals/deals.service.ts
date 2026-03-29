import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
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

    // Sale price and commission rate are set by the company on the property listing
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
