import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async requestVisit(agentId: string, propertyId: string, clientName: string, clientPhone: string, scheduledAt: Date) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'AVAILABLE') throw new ForbiddenException('Property is no longer available for visits');

    return this.prisma.visit.create({
      data: {
        propertyId,
        agentId,
        clientName,
        clientPhone,
        scheduledAt: new Date(scheduledAt),
        status: 'PENDING'
      }
    });
  }

  async getMyVisits(userId: string, role: string) {
    if (role === 'COMPANY') {
      // Find visits requested for the properties owned by this company
      return this.prisma.visit.findMany({
        where: { property: { companyId: userId } },
        include: { 
          property: true, 
          agent: { select: { email: true, phone: true } } 
        }
      });
    } else {
      // Otherwise find the visits this agent requested
      return this.prisma.visit.findMany({
        where: { agentId: userId },
        include: { property: true }
      });
    }
  }

  async approveOrReject(companyId: string, visitId: string, status: 'APPROVED' | 'REJECTED') {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { property: true }
    });

    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.property.companyId !== companyId) {
      throw new ForbiddenException("You can only approve visits for your own company's properties");
    }

    return this.prisma.visit.update({
      where: { id: visitId },
      data: { status }
    });
  }
}
