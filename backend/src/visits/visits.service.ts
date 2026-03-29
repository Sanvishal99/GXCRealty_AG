import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyStatus, VisitStatus, Role } from '@prisma/client';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async requestVisit(agentId: string, propertyId: string, clientName: string, clientPhone: string, scheduledAt: Date) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new ForbiddenException('Property is no longer available for visits');
    }
    if (new Date(scheduledAt) < new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    return this.prisma.visit.create({
      data: {
        propertyId,
        agentId,
        clientName,
        clientPhone,
        scheduledAt: new Date(scheduledAt),
        status: VisitStatus.PENDING,
      },
      include: { property: { select: { id: true, title: true, city: true } } },
    });
  }

  async getMyVisits(userId: string, role: Role) {
    if (role === Role.COMPANY) {
      return this.prisma.visit.findMany({
        where: { property: { companyId: userId } },
        include: {
          property: { select: { id: true, title: true, city: true } },
          agent: { select: { id: true, email: true, phone: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }
    if (role === Role.ADMIN) {
      return this.prisma.visit.findMany({
        include: {
          property: { select: { id: true, title: true, city: true } },
          agent: { select: { id: true, email: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }
    return this.prisma.visit.findMany({
      where: { agentId: userId },
      include: { property: { select: { id: true, title: true, city: true } } },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async approveOrReject(userId: string, visitId: string, status: VisitStatus) {
    const validTransitions: VisitStatus[] = [VisitStatus.APPROVED, VisitStatus.REJECTED];
    if (!validTransitions.includes(status)) {
      throw new BadRequestException('Status must be APPROVED or REJECTED');
    }

    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      include: { property: true },
    });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.property.companyId !== userId) {
      throw new ForbiddenException("You can only manage visits for your own properties");
    }
    if (visit.status !== VisitStatus.PENDING) {
      throw new BadRequestException('Only pending visits can be approved or rejected');
    }

    return this.prisma.visit.update({ where: { id: visitId }, data: { status } });
  }

  async markCompleted(agentId: string, visitId: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.agentId !== agentId) throw new ForbiddenException('Not your visit');
    if (visit.status !== VisitStatus.APPROVED) {
      throw new BadRequestException('Only approved visits can be marked as completed');
    }
    return this.prisma.visit.update({ where: { id: visitId }, data: { status: VisitStatus.COMPLETED } });
  }
}
