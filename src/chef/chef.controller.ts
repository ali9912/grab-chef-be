import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ChefService } from './chef.service';

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
