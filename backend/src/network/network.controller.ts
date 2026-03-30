import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NetworkService } from './network.service';

@Controller('network')
@UseGuards(AuthGuard('jwt'))
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  /** Full 5-level tree rooted at the authenticated agent */
  @Get('tree')
  async getMyTree(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.networkService.getTreeNode(userId, 1, 5);
  }

  /**
   * Drill-down: get the subtree rooted at any node.
   * In a real app you'd verify the node belongs to caller's downline.
   * Here we just return the subtree from that node at remaining levels.
   */
  @Get('node/:userId')
  async getSubtree(
    @Request() req,
    @Param('userId') userId: string,
    @Query('depth') depth?: string,
  ) {
    const maxDepth = depth ? Math.min(parseInt(depth), 5) : 5;
    return this.networkService.getTreeNode(userId, 1, maxDepth);
  }

  /** Network summary stats for the authenticated agent */
  @Get('summary')
  async getSummary(@Request() req) {
    const userId = req.user.id || req.user.sub;
    return this.networkService.getNetworkSummary(userId);
  }

  /** Activity feed from all downline (last 30 days, up to 50 events) */
  @Get('activity')
  async getActivityFeed(@Request() req, @Query('limit') limit?: string) {
    const userId = req.user.id || req.user.sub;
    const take = limit ? Math.min(parseInt(limit), 100) : 50;
    return this.networkService.getActivityFeed(userId, take);
  }
}
