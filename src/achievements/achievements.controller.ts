import { Body, Controller, Get, HttpException, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';
import { CreateAchievementDto } from './Dto/create-achievement.dto';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createAchievementDto: CreateAchievementDto, @Req() request: RequestUser) {
    try {
      const userId = request.user._id.toString()
      return await this.achievementsService.create(createAchievementDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async checkForAchievements(@Req() request: RequestUser) {
    try {
      const userId = request.user._id.toString()
      return await this.achievementsService.checkForAchievements(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get achievements',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
