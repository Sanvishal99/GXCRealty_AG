import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ConfigService } from './config.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  // Public — frontend fetches this to build commission calculators and branding
  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  // Only ADMIN can update platform config
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Patch()
  async updateConfig(@Body() body: {
    commissionPoolPct?: number;
    agentSplitPct?: number;
    networkPoolPct?: number;
    companySplitPct?: number;
    tierSplits?: number[];
    brandingLogoUrl?: string;
    brandingEmoji?: string;
  }) {
    return this.configService.updateConfig(body);
  }
}
