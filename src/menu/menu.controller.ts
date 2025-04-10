import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/interfaces/user.interface';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async create(@Body() createMenuDto: CreateMenuDto, @Req() req: RequestUser) {
    try {
      const user = req.user;
      return this.menuService.create(createMenuDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @Req() req: RequestUser,
  ) {
    try {
      const user = req.user;
      return this.menuService.update(id, updateMenuDto, user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to edit menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  getCurrentChefMenu(@Req() req: RequestUser) {
    try {
      const user = req.user;
      return this.menuService.getCurrentChefMenus(req.user);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chef menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.menuService.getMenuById(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chef/:chefId')
  @UseGuards(JwtAuthGuard)
  getAllMenuByChef(@Param('chefId') chefId: string) {
    try {
      return this.menuService.getAllMenuByChef(chefId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get chef menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.menuService.remove(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get menu.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
