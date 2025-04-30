import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { UserRole } from 'src/users/interfaces/user.interface';
import { GetChefQueryType } from '../common/dto/pagination.dto';
import { ChefService } from './chef.service';
import { CreateEmergencyDto } from './dto/-emergency.dto';
import { BusyDataDto } from './dto/busy-data-dto';

@Controller('chef')
export class ChefController {
  constructor(private readonly chefService: ChefService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getAllChefs(
    @Query() getChefQuery: GetChefQueryType,
    @Req() req: RequestUser,
  ) {
    try {
      const customerId =
        req?.user?.role === UserRole.CUSTOMER ? req?.user?._id?.toString() : '';
      return await this.chefService.getAllChefs(getChefQuery, customerId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('busydays')
  @UseGuards(JwtAuthGuard)
  async getChefBusyDays(@Req() req: RequestUser) {
    try {
      const { _id } = req.user;
      return await this.chefService.getChefBusySchedule(_id.toString());
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':chefId/busydays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getChefBusyDaysById(@Param('chefId') chefId: string) {
    try {
      return await this.chefService.getChefBusyScheduleById(chefId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('favourite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async getCustomerFavouritesChef(@Req() req: RequestUser) {
    try {
      const customer = req.user._id.toString();
      return await this.chefService.getCustomerFavouritesChef(customer);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add favourite chef',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':chefId/favourite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async addChefToFavourite(
    @Param('chefId') chefId: string,
    @Req() req: RequestUser,
  ) {
    try {
      const customer = req.user._id.toString();
      return await this.chefService.addToFavourite(customer, chefId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add favourite chef',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':chefId/favourite')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async removeChefToFavourite(
    @Param('chefId') chefId: string,
    @Req() req: RequestUser,
  ) {
    try {
      const customer = req.user._id.toString();
      return await this.chefService.removeFromFavourite(customer, chefId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to remove favourite chef',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('busydays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async addEventToChefCalendar(
    @Body() busyDataDto: BusyDataDto,
    @Req() req: RequestUser,
  ) {
    try {
      const { _id } = req.user;
      return await this.chefService.addEventToChefCalendar(
        busyDataDto,
        _id.toString(),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('emergency')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async addChefEmergencyContact(
    @Body() createEmergencyaDto: CreateEmergencyDto,
    @Req() req: RequestUser,
  ) {
    try {
      const { _id } = req.user;
      return await this.chefService.addChefEmergencyContact(
        createEmergencyaDto,
        _id.toString(),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('emergency')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getCurrentChefEmergencyContact(@Req() req: RequestUser) {
    try {
      const { _id } = req.user;
      return await this.chefService.getChefEmergencyContacts(_id.toString());
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/emergency')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getChefEmergencyContact(@Param('userId') userId: string) {
    try {
      return await this.chefService.getChefEmergencyContacts(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chefs',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Post('menu')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.CHEF)
  // async addMenuItem(@Body() menuItemDto: MenuItemDto) {
  //   try {
  //     return await this.chefService.addMenuItem(menuItemDto);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to add menu item',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
