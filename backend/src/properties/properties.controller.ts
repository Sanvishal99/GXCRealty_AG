import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PropertyStatus, Role, ProjectType, ProjectStage } from '@prisma/client';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async getAll(
    @Query('city') city?: string,
    @Query('type') type?: ProjectType,
    @Query('stage') stage?: ProjectStage,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.propertiesService.findAll({
      city,
      type,
      stage,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('company/mine')
  async getMine(@Request() req) {
    return this.propertiesService.findByCompany(req.user.id || req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  async getAll2() {
    return this.propertiesService.findAllAdmin();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createProperty(@Request() req, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    try {
      return await this.propertiesService.createListing(userId, req.user.role, body);
    } catch (err) {
      // Error logged by global exception filter
      const msg = err?.message || 'Failed to create property';
      // Surface Prisma validation errors as 400 so the frontend sees the real problem
      if (err?.name === 'PrismaClientValidationError' || err?.code?.startsWith('P2')) {
        throw new BadRequestException(msg);
      }
      throw new InternalServerErrorException(msg);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async updateProperty(@Request() req, @Param('id') id: string, @Body() body: any) {
    const userId = req.user.id || req.user.sub;
    return this.propertiesService.updateListing(id, userId, req.user.role, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(@Request() req, @Param('id') id: string, @Body() body: { status: PropertyStatus }) {
    return this.propertiesService.updateStatus(id, body.status, req.user.id || req.user.sub);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/interests')
  async getInterests(@Param('id') id: string, @Query('days') days?: string) {
    const since = days ? new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) : undefined;
    return this.propertiesService.getInterests(id, since);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('documents/:docId')
  async renameDocument(@Request() req, @Param('docId') docId: string, @Body() body: { title: string }) {
    return this.propertiesService.renameDocument(docId, body.title, req.user.id || req.user.sub, req.user.role);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bulk-import')
  async bulkImport(@Request() req, @Body() body: { rows: any[] }) {
    const userId = req.user.id || req.user.sub;
    if (!Array.isArray(body?.rows) || body.rows.length === 0) {
      throw new BadRequestException('rows must be a non-empty array');
    }
    if (body.rows.length > 200) {
      throw new BadRequestException('Maximum 200 properties per import');
    }
    return this.propertiesService.bulkImport(userId, req.user.role, body.rows);
  }
}
