import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PropertyStatus, Role, ProjectType, ProjectStage } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters?: { city?: string; type?: ProjectType; stage?: ProjectStage; minPrice?: number; maxPrice?: number }) {
    return this.prisma.property.findMany({
      where: {
        status: PropertyStatus.AVAILABLE,
        ...(filters?.city && { city: { contains: filters.city, mode: 'insensitive' } }),
        ...(filters?.type && { projectType: filters.type }),
        ...(filters?.stage && { projectStage: filters.stage }),
        ...(filters?.minPrice !== undefined && { price: { gte: filters.minPrice } }),
        ...(filters?.maxPrice !== undefined && { price: { lte: filters.maxPrice } }),
      },
      include: {
        company: { select: { id: true, email: true, phone: true } },
        units: true,
        documents: { select: { id: true, type: true, title: true, url: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, email: true, phone: true } },
        units: true,
        documents: true,
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async findAllAdmin() {
    return this.prisma.property.findMany({
      include: {
        company: { select: { id: true, email: true, phone: true } },
        units: true,
        documents: true,
        _count: { select: { visits: true, deals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.property.findMany({
      where: { companyId },
      include: {
        units: true,
        documents: { select: { id: true, type: true, title: true, url: true } },
        _count: { select: { visits: true, deals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createListing(companyId: string, role: Role, data: any) {
    if (role !== Role.COMPANY && role !== Role.ADMIN) {
      throw new ForbiddenException('Only companies or admins can list properties.');
    }

    const status = role === Role.ADMIN ? PropertyStatus.AVAILABLE : PropertyStatus.PENDING_APPROVAL;
    const flat = this.flattenPropertyData(data);
    const { units, docs, ...rest } = flat;

    return this.prisma.property.create({
      data: {
        ...rest,
        companyId,
        status,
        ...(units?.length && {
          units: {
            create: units.map((u: any) => ({
              name:           u.name           || 'Unit',
              beds:           Number(u.beds)           || 0,
              baths:          Number(u.baths)          || 0,
              balconies:      Number(u.balconies)      || 0,
              superArea:      Number(u.superArea)      || 0,
              carpetArea:     Number(u.carpetArea)     || 0,
              minPrice:       Number(u.price || u.minPrice) || 0,
              maxPrice:       Number(u.maxPrice)       || undefined,
              totalUnits:     Number(u.total || u.totalUnits)     || 1,
              availableUnits: Number(u.available || u.availableUnits) || 1,
            })),
          },
        }),
        ...(docs?.length && {
          documents: {
            create: docs.map((d: any) => ({
              type:  d.type  || 'Other',
              title: d.name  || d.title || d.type || 'Document',
              url:   d.url,
            })),
          },
        }),
      },
      include: { units: true, documents: true },
    });
  }

  async getInterests(propertyId: string, since?: Date) {
    return this.prisma.leadInterestedProperty.findMany({
      where: {
        propertyId,
        ...(since && { createdAt: { gte: since } }),
      },
      include: {
        lead: {
          select: {
            id: true,
            buyerName: true,
            buyerPhone: true,
            stage: true,
            agent: { select: { id: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(propertyId: string, status: PropertyStatus, adminId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    return this.prisma.property.update({ where: { id: propertyId }, data: { status } });
  }

  private parseCoord(raw: any): number | undefined {
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    return isNaN(n) ? undefined : n;
  }

  private parseDateTime(raw: string | undefined): Date | undefined {
    if (!raw) return undefined;
    const s = raw.trim();
    if (!s) return undefined;
    // date-only "YYYY-MM-DD" → append midnight UTC so Prisma accepts it
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00.000Z` : s;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? undefined : d;
  }

  private mapProjectStage(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const map: Record<string, string> = {
      'upcoming':           'UPCOMING',
      'under construction': 'UNDER_CONSTRUCTION',
      'ready to move':      'READY_TO_MOVE',
    };
    return map[raw.toLowerCase()] ?? raw;
  }

  private flattenPropertyData(data: any): any {
    const loc = data.location || {};
    const pricing = data.pricing || {};
    const builder = data.builder || {};

    // Flatten amenities object {common:[], lifestyle:[], premium:[]} → string[]
    let amenities: string[] = [];
    if (Array.isArray(data.amenities)) {
      amenities = data.amenities;
    } else if (data.amenities && typeof data.amenities === 'object') {
      amenities = [
        ...(data.amenities.common || []),
        ...(data.amenities.lifestyle || []),
        ...(data.amenities.premium || []),
      ];
    }

    const flat: any = {
      // Core identity
      title:            data.title || data.name,
      description:      data.description,
      projectType:      data.projectType || (data.type ? String(data.type).toUpperCase() : undefined),
      projectStage:     data.projectStage || this.mapProjectStage(data.statusEnum),

      // Location (flat)
      city:             data.city      || loc.city,
      state:            data.state     || loc.state,
      locality:         data.locality  || loc.area,
      address:          data.address   || loc.address,
      pincode:          data.pincode   || loc.pincode,
      latitude:         this.parseCoord(data.latitude  ?? loc.lat),
      longitude:        this.parseCoord(data.longitude ?? loc.lng),
      // Pricing (flat)
      price:            data.price          != null ? Number(data.price)          : (pricing.minPrice   != null ? Number(pricing.minPrice)   : undefined),
      maxPrice:         data.maxPrice       != null ? Number(data.maxPrice)       : (pricing.maxPrice   != null ? Number(pricing.maxPrice)   : undefined),
      pricePerSqFt:     data.pricePerSqFt   != null ? Number(data.pricePerSqFt)   : (pricing.pricePerSqFt != null ? Number(pricing.pricePerSqFt) : undefined),
      bookingAmount:    data.bookingAmount   != null ? Number(data.bookingAmount)  : (pricing.bookingAmount != null ? Number(pricing.bookingAmount) : undefined),
      maintenanceCharge:data.maintenanceCharge != null ? Number(data.maintenanceCharge) : (pricing.maintenance != null ? Number(pricing.maintenance) : undefined),
      commissionPoolPct:data.commissionPoolPct != null ? Number(data.commissionPoolPct) : (pricing.commissionValue != null ? Number(pricing.commissionValue) : undefined),

      // Builder
      builderName:      data.builderName    || builder.name,
      builderContact:   data.builderContact || builder.contact,
      builderEmail:     data.builderEmail   || builder.email,
      builderAddress:   data.builderAddress || builder.address,

      // Other flat fields — dates must be ISO-8601 DateTime; date-only strings (YYYY-MM-DD) get midnight UTC appended
      possessionDate:   this.parseDateTime(data.possessionDate),
      launchDate:       this.parseDateTime(data.launchDate),
      reraId:           data.reraId || data.reraNumber,
      images:           Array.isArray(data.images) ? data.images : undefined,
      amenities,

      // Pass units and docs through for caller to handle
      units: data.units,
      docs:  Array.isArray(data.docs) ? data.docs : undefined,
    };

    // Strip undefined, empty strings, and NaN — Prisma rejects all three
    Object.keys(flat).forEach(k => {
      const v = flat[k];
      if (v === undefined || v === null || v === '') { delete flat[k]; return; }
      if (typeof v === 'number' && isNaN(v)) { delete flat[k]; return; }
    });

    return flat;
  }

  async bulkImport(companyId: string, role: Role, rows: any[]) {
    const results: { index: number; success: boolean; id?: string; title?: string; error?: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const prop = await this.createListing(companyId, role, rows[i]);
        results.push({ index: i, success: true, id: prop.id, title: prop.title });
      } catch (err: any) {
        results.push({ index: i, success: false, title: rows[i]?.title || rows[i]?.name, error: err?.message });
      }
    }
    const succeeded = results.filter(r => r.success).length;
    return { total: rows.length, succeeded, failed: rows.length - succeeded, results };
  }

  async renameDocument(docId: string, title: string, userId: string, role: Role) {
    const doc = await this.prisma.propertyDocument.findUnique({
      where: { id: docId },
      include: { property: { select: { companyId: true } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    if (role !== Role.ADMIN && doc.property.companyId !== userId) {
      throw new ForbiddenException('You can only edit your own property documents.');
    }
    return this.prisma.propertyDocument.update({ where: { id: docId }, data: { title } });
  }

  async updateListing(propertyId: string, companyId: string, role: Role, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (role !== Role.ADMIN && property.companyId !== companyId) {
      throw new ForbiddenException('You can only edit your own properties.');
    }
    const flat = this.flattenPropertyData(data);
    const { units, docs, ...rest } = flat;
    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        ...rest,
        ...(docs?.length && {
          documents: {
            create: docs.map((d: any) => ({
              type:  d.type  || 'Other',
              title: d.name  || d.title || d.type || 'Document',
              url:   d.url,
            })),
          },
        }),
      },
    });
  }
}
