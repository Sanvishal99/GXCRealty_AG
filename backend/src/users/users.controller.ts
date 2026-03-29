import { Controller, Get, Param, Query, UseGuards, Request, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, Status } from '@prisma/client';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Returns the authenticated user's own profile
  @Get('me')
  async getMe(@Request() req) {
    const id = req.user.id || req.user.sub;
    return this.usersService.findById(id);
  }

  // Admin — list all users with optional role/status filter
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getAll(@Query('role') role?: Role, @Query('status') status?: Status) {
    return this.usersService.findAll({ role, status });
  }

  // Admin — update a user's status
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: Status }) {
    return this.usersService.updateStatus(id, body.status);
  }

  @Get(':id/upline')
  async getUpline(@Param('id') id: string) {
    return this.usersService.getUpline(id);
  }

  @Get(':id/downline')
  async getDownline(@Param('id') id: string) {
    return this.usersService.getDownline(id);
  }
}
