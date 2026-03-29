import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('deals')
@UseGuards(AuthGuard('jwt'))
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  async getDeals(@Request() req, @Query('agentId') agentId?: string, @Query('companyId') companyId?: string) {
    const userId = req.user.id || req.user.sub;
    const role = req.user.role;

    // Scope results based on role
    if (role === 'AGENT') return this.dealsService.getDeals({ agentId: userId });
    if (role === 'COMPANY') return this.dealsService.getDeals({ companyId: userId });
    // ADMIN sees all, or can filter by query params
    return this.dealsService.getDeals({ agentId, companyId });
  }

  @Post('close')
  async closeDeal(
    @Request() req,
    @Body() body: { propertyId: string },
  ) {
    const agentId = req.user.id || req.user.sub;
    return this.dealsService.closeDeal(body.propertyId, agentId);
  }
}
