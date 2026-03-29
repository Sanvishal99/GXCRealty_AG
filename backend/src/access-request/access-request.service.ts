import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessRequestStatus } from '@prisma/client';

@Injectable()
export class AccessRequestService {
  constructor(private prisma: PrismaService) {}

  async create(data: { fullName: string; email: string; phone: string; experience: string }) {
    return this.prisma.accessRequest.create({ data });
  }

  async findAll(status?: AccessRequestStatus) {
    return this.prisma.accessRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countPending() {
    return this.prisma.accessRequest.count({ where: { status: 'PENDING' } });
  }

  async review(id: string, status: AccessRequestStatus, adminNote: string | undefined, reviewedBy: string) {
    return this.prisma.accessRequest.update({
      where: { id },
      data: { status, adminNote, reviewedAt: new Date(), reviewedBy },
    });
  }
}
