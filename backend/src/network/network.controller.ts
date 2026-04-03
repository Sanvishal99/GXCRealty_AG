import { Controller, Get, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
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
   * Drill-down: get the subtree rooted at a node.
   * Only admins can view arbitrary nodes; agents can only drill into
   * nodes that are within their own downline.
   */
  @Get('node/:userId')
  async getSubtree(
    @Request() req,
    @Param('userId') userId: string,
    @Query('depth') depth?: string,
  ) {
    const callerId = req.user.id || req.user.sub;
    const callerRole = req.user.role;
    const maxDepth = depth ? Math.min(parseInt(depth), 5) : 5;

    if (callerRole !== 'ADMIN') {
      // Verify the requested node is within the caller's downline
      const downlineIds = await this.networkService.getAllDownlineIds(callerId);
      if (!downlineIds.has(userId) && userId !== callerId) {
        throw new ForbiddenException('You can only view nodes within your own network.');
      }
    }

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
