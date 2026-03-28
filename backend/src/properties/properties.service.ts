import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  // Anyone can browse available properties
  async findAll() {
    return this.prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      include: { company: { select: { email: true, phone: true } } }
    });
  }

  // Only Companies can list properties
  async createListing(companyId: string, role: string, data: { title: string, description: string, price: number }) {
    if (role !== 'COMPANY' && role !== 'ADMIN') {
      throw new ForbiddenException('Only companies or admins can list properties.');
    }

    return this.prisma.property.create({
      data: {
        ...data,
        companyId,
        status: 'AVAILABLE',
      }
    });
  }
}
