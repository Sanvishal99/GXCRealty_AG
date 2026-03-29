import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform')
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('audit-logs')
  getAuditLogs(
    @Request() req,
    @Query('entity') entity?: string,
    @Query('take') take?: string,
  ) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException();
    return this.analyticsService.getAuditLogs(entity, take ? parseInt(take) : 100);
  }
}

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AgentAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me')
  getMyStats(@Request() req) {
    return this.analyticsService.getAgentStats(req.user.id || req.user.sub);
  }
}
