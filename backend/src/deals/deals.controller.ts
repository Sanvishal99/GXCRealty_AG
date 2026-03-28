import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DealsService } from './deals.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @UseGuards(AuthGuard('jwt')) 
  @Post('close')
  async closeDeal(
    @Request() req, 
    @Body() body: { propertyId: string, salePrice: number, totalCommissionRate: number }
  ) {
    const agentId = req.user.sub || req.user.id; // From JWT payload
    return this.dealsService.closeDeal(
      body.propertyId, 
      agentId, 
      body.salePrice, 
      body.totalCommissionRate
    );
  }
}
