import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { LocationDto } from './dto/location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async addLocation(@Body() locationDto: LocationDto, @Request() req) {
    try {
      return await this.customerService.addLocation(req.user.userId, locationDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add location',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('locations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getLocations(@Request() req) {
    try {
      return await this.customerService.getLocations(req.user.userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get locations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
