import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChefService } from './chef.service';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/interfaces/user.interface';
import { BusyDataDto } from './dto/busy-data-dto';

@Controller('chef')
export class ChefController {
  constructor(private readonly chefService: ChefService) {}

  @Get('list')
  async getAllChefs(@Query() paginationDto: PaginationDto) {
    try {
      return await this.chefService.getAllChefs(paginationDto);
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
