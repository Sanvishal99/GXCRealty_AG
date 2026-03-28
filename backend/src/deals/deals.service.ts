import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../commission/commission.service';

@Injectable()
export class DealsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
  ) {}

  async closeDeal(
    propertyId: string, 
    agentId: string, 
    salePrice: number, 
    totalCommissionRate: number
  ) {
    // 1. Fetch Property and verify it hasn't been sold
    const property = await this.prisma.property.findUnique({ where: { id: propertyId }});
    if (!property) throw new NotFoundException('Property not found');
    if (property.status === 'SOLD') throw new NotFoundException('Property already sold');

    // 2. Create the Deal
    const deal = await this.prisma.deal.create({
      data: {
        propertyId,
        agentId,
        salePrice,
        totalCommission: totalCommissionRate,
      }
    });

    // 3. Update Property status to SOLD
    await this.prisma.property.update({
      where: { id: propertyId },
      data: { status: 'SOLD' },
    });

    // 4. Distribute Commissions via Engine
    await this.commissionService.distributeCommission(
       deal.id, 
       agentId, 
       property.companyId, 
       salePrice, 
       totalCommissionRate
    );

    return deal;
  }
}
