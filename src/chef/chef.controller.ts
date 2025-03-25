import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';
import { ChefService } from './chef.service';
import { RegisterChefDto } from './dto/register-chef.dto';
import { MenuItemDto } from './dto/menu-item.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('chef')
export class ChefController {
  constructor(private readonly chefService: ChefService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idCard', maxCount: 1 },
      { name: 'certifications', maxCount: 1 },
    ]),
  )
  async registerChef(
    @Body() registerChefDto: RegisterChefDto,
    @UploadedFiles() files: { idCard: Express.Multer.File[], certifications: Express.Multer.File[] },
  ) {
    try {
      return await this.chefService.registerChef(registerChefDto, files);
    } catch (error) {
      throw new HttpException(
        error.message || 'Chef registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

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

  @Get(':chefId/status')
  @UseGuards(JwtAuthGuard)
  async getChefStatus(@Param('chefId') chefId: string) {
    try {
      return await this.chefService.getChefStatus(chefId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chef status',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('menu')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async addMenuItem(@Body() menuItemDto: MenuItemDto) {
    try {
      return await this.chefService.addMenuItem(menuItemDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add menu item',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('menu/:menuItemId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async updateMenuItem(
    @Param('menuItemId') menuItemId: string,
    @Body() menuItemDto: MenuItemDto,
  ) {
    try {
      return await this.chefService.updateMenuItem(menuItemId, menuItemDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update menu item',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
