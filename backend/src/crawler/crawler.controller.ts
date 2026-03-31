import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('crawler')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  /**
   * GET /crawler/status
   * Returns the last run info without triggering a scrape.
   */
  @Get('status')
  getStatus() {
    return this.crawlerService.getStatus();
  }

  /**
   * POST /crawler/run
   * Manually trigger a scrape job immediately (admin only).
   */
  @Post('run')
  async runNow() {
    return this.crawlerService.runScrape();
  }
}
