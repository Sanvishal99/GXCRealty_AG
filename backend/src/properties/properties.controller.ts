import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  async getAll() {
    return this.propertiesService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createProperty(@Request() req, @Body() body: { title: string, description: string, price: number }) {
    const userId = req.user.id || req.user.sub;
    const role = req.user.role; // Needs to be 'COMPANY'
    return this.propertiesService.createListing(userId, role, body);
  }
}
