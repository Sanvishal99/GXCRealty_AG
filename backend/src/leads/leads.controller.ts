import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  getLeads(@Request() req) {
    return this.leadsService.getLeads(req.user.id || req.user.sub, req.user.role);
  }

  @Post()
  createLead(@Request() req, @Body() body: any) {
    return this.leadsService.createLead(req.user.id || req.user.sub, body);
  }

  @Patch(':id')
  updateLead(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.leadsService.updateLead(id, req.user.id || req.user.sub, req.user.role, body);
  }

  @Delete(':id')
  deleteLead(@Request() req, @Param('id') id: string) {
    return this.leadsService.deleteLead(id, req.user.id || req.user.sub, req.user.role);
  }

  // ── Interested Properties ──────────────────────────────────────────────────

  @Post(':id/interested-properties')
  addInterestedProperty(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { propertyId: string },
  ) {
    return this.leadsService.addInterestedProperty(
      id, req.user.id || req.user.sub, req.user.role, body.propertyId,
    );
  }

  @Delete(':id/interested-properties/:propertyId')
  removeInterestedProperty(
    @Request() req,
    @Param('id') id: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.leadsService.removeInterestedProperty(
      id, req.user.id || req.user.sub, req.user.role, propertyId,
    );
  }

  // ── Schedule Visit from Lead ───────────────────────────────────────────────

  @Post(':id/schedule-visit')
  scheduleVisit(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.leadsService.scheduleVisitForLead(
      id, req.user.id || req.user.sub, req.user.role, body,
    );
  }
}
