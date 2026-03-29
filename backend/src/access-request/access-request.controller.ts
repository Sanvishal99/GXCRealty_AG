import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AccessRequestService } from './access-request.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, AccessRequestStatus } from '@prisma/client';

// Public — anyone can submit an access request
@Controller('access-requests')
export class AccessRequestPublicController {
  constructor(private readonly service: AccessRequestService) {}

  @Post()
  async submit(@Body() body: { fullName: string; email: string; phone: string; experience: string }) {
    return this.service.create(body);
  }
}

// Admin-only — review and list requests
@Controller('access-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AccessRequestAdminController {
  constructor(private readonly service: AccessRequestService) {}

  @Get()
  async list(@Query('status') status?: AccessRequestStatus) {
    return this.service.findAll(status);
  }

  @Get('pending-count')
  async pendingCount() {
    const count = await this.service.countPending();
    return { count };
  }

  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() body: { status: AccessRequestStatus; adminNote?: string },
    @Request() req: any,
  ) {
    const adminId = req.user.id || req.user.sub;
    return this.service.review(id, body.status, body.adminNote, adminId);
  }
}
