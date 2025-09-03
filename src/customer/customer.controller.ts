import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { UserRole } from 'src/users/interfaces/user.interface';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { LocationDto } from 'src/common/dto/location.dto';

@ApiTags('Customer')
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) { }

  @ApiBearerAuth('JWT-auth')
  @Get('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getCustomerLocation(@Req() req: RequestUser) {
    try {
      const userId = req.user._id.toString()
      return await this.customerService.getMySavedLocations(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get customer locations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Post('location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async addCustomerLocation(@Body() addCustomerLocationDto: LocationDto, @Req() req: RequestUser) {
    try {
      const userId = req.user._id.toString()
      return await this.customerService.addCustomerLocation(userId, addCustomerLocationDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add customer locations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Put('location/:locationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async editCustomerLocation(@Param("locationId") locationId: string, @Body() addCustomerLocationDto: LocationDto, @Req() req: RequestUser) {
    try {
      const userId = req.user._id.toString()
      return await this.customerService.editCustomerLocation(userId, { ...addCustomerLocationDto, locationId });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add customer locations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiBearerAuth('JWT-auth')
  @Delete('location/:locationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async removeCustomerLocation(@Param("locationId") locationId: string, @Req() req: RequestUser) {
    try {
      const userId = req.user._id.toString()
      return await this.customerService.removeCustomerLocation(userId, locationId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add customer locations',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}