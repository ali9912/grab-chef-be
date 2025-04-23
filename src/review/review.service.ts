import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './interfaces/review.interface';
import { ReviewDto } from './dto/review.dto';
import { EventService } from '../event/event.service';
import { EventStatus } from '../event/interfaces/event.interface';
import { Chef } from 'src/chef/interfaces/chef.interface';
import { AchievementsService } from 'src/achievements/achievements.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    @InjectModel('Chef') private readonly chefModel: Model<Chef>,
    private readonly eventService: EventService,
    private readonly achievementService: AchievementsService,
  ) {}

  async submitReview(
    customerId: string,
    eventId: string,
    reviewDto: ReviewDto,
  ) {
    // Get event
    const { event } = await this.eventService.getEventById(eventId);

    // Verify event exists and belongs to customer
    if (event.customer._id.toString() !== customerId) {
      throw new HttpException(
        'Event does not belong to customer',
        HttpStatus.FORBIDDEN,
      );
    }

    // Verify event is completed
    if (event.status !== EventStatus.COMPLETED) {
      throw new HttpException(
        'Cannot review an incomplete event',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if review already exists
    const existingReview = await this.reviewModel
      .findOne({ event: eventId, customer: customerId })
      .exec();

    // if (existingReview) {
    //   throw new HttpException(
    //     'Review already submitted for this event',
    //     HttpStatus.BAD_REQUEST,
    //   );
    // }

    const chefUser = await this.chefModel.findOne({
      userId: event.chef._id.toString(),
    });
    if (chefUser) {
      const noOfReviews = chefUser.noOfReviews + 1;
      chefUser.noOfReviews = noOfReviews;

      const avgRating = (chefUser.avgRating + reviewDto.rating) / noOfReviews;
      chefUser.avgRating = avgRating;

      if (reviewDto.rating >= 4 && reviewDto.rating < 5) {
        const noOfFourStars = chefUser.noOfFourStars + 1;
        chefUser.noOfFourStars = noOfFourStars;
      }

      if (reviewDto.rating >= 5) {
        const noOfFiveStars = chefUser.noOfFiveStars + 1;
        chefUser.noOfFiveStars = noOfFiveStars;
      }

      await chefUser.save();
    }

    // Create review
    const review = new this.reviewModel({
      event: eventId,
      chef: event.chef,
      customer: customerId,
      rating: reviewDto.rating,
      review: reviewDto.review,
    });

    await review.save();

    await this.achievementService.checkForAchievements(
      event.chef._id.toString(),
    );

    return { message: 'Review submitted successfully' };
  }

  async getReviewsByChefId(chefId: string) {
    const reviews = await this.reviewModel
      .find({ chef: chefId })
      .populate('customer')
      .exec();
    const avgRating = await this.calculateChefAverageRating(chefId);
    return {
      reviews,
      avgRating
    };
  }

  async getChefReviews(chefId: string) {
    const reviews = await this.reviewModel
      .find({ chef: chefId })
      .populate('customer')
      .exec();
    const avgRating = await this.calculateChefAverageRating(chefId);
    return {
      reviews,
      avgRating,
    };
  }

  async calculateChefAverageRating(chefId: string) {
    const result = await this.chefModel.findOne({userId:chefId})

    return result?.avgRating || 0;
  }
}
