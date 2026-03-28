import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  async requestVisit(
    @Request() req, 
    @Body() body: { propertyId: string, clientName: string, clientPhone: string, scheduledAt: string }
  ) {
    const agentId = req.user.id || req.user.sub;
    return this.visitsService.requestVisit(agentId, body.propertyId, body.clientName, body.clientPhone, new Date(body.scheduledAt));
  }

  @Get()
  async getMyVisits(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.visitsService.getMyVisits(userId, req.user.role);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req, 
    @Param('id') visitId: string, 
    @Body() body: { status: 'APPROVED' | 'REJECTED' }
  ) {
    const companyId = req.user.id || req.user.sub;
    return this.visitsService.approveOrReject(companyId, visitId, body.status);
  }
}
