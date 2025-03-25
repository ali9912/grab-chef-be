import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user.interface';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  async submitReview(
    @Param('eventId') eventId: string,
    @Body() reviewDto: ReviewDto,
    @Request() req,
  ) {
    try {
      return await this.reviewService.submitReview(req.user.userId, eventId, reviewDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to submit review',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
