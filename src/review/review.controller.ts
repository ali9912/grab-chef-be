import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
  Req,
  Get,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';
import { RequestUser } from 'src/auth/interfaces/request-user.interface';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async submitReview(
    @Param('eventId') eventId: string,
    @Body() reviewDto: ReviewDto,
    @Req() req: RequestUser,
  ) {
    try {
      return await this.reviewService.submitReview(
        req.user._id.toString(),
        eventId,
        reviewDto,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to submit review',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chef/:userId')
  @UseGuards(JwtAuthGuard)
  async getReviewsByChefId(@Param('userId') userId: string) {
    try {
      return await this.reviewService.getReviewsByChefId(
        // req.user._id.toString(),
        userId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get reviews',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chef')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CHEF)
  async getChefReviews(@Req() req: RequestUser) {
    try {
      return await this.reviewService.getReviewsByChefId(
        req.user._id.toString(),
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get reviews',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
