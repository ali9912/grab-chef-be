import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { CreateAchievementDto } from './Dto/create-achievement.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/interfaces/user.interface';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createAchievementDto: CreateAchievementDto,
    @Req() request: RequestUser,
  ) {
    try {
      const userId = request.user._id.toString();
      return await this.achievementsService.create(createAchievementDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Get()
  // @UseGuards(JwtAuthGuard)
  // async checkForAchievements(@Req() request: RequestUser) {
  //   try {
  //     const userId = request.user._id.toString()
  //     return await this.achievementsService.checkForAchievements(userId);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to get achievements',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Get('/goals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getAchivementGoals(@Req() request: RequestUser) {
    try {
      const userId = request.user._id.toString();
      return await this.achievementsService.getAchivementGoals(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getMyAchivementGoals(@Req() request: RequestUser) {
    try {
      const userId = request.user._id.toString();
      return await this.achievementsService.getMyAchievements(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/chef/:userId')
  @UseGuards(JwtAuthGuard)
  async getChefAchivementGoals(@Param('userId') userId: string) {
    try {
      return await this.achievementsService.getChefAchivementGoals(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
