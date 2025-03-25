import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './interfaces/review.interface';
import { ReviewDto } from './dto/review.dto';
import { EventService } from '../event/event.service';
import { EventStatus } from '../event/interfaces/event.interface';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    private readonly eventService: EventService,
  ) {}

  async submitReview(customerId: string, eventId: string, reviewDto: ReviewDto) {
    // Get event
    const event = await this.eventService.getEventById(eventId);
    
    // Verify event exists and belongs to customer
    if (event.customer.toString() !== customerId) {
      throw new HttpException('Event does not belong to customer', HttpStatus.FORBIDDEN);
    }
    
    // Verify event is completed
    if (event.status !== EventStatus.COMPLETED) {
      throw new HttpException('Cannot review an incomplete event', HttpStatus.BAD_REQUEST);
    }
    
    // Check if review already exists
    const existingReview = await this.reviewModel
      .findOne({ event: eventId, customer: customerId })
      .exec();
      
    if (existingReview) {
      throw new HttpException('Review already submitted for this event', HttpStatus.BAD_REQUEST);
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
    
    return { message: 'Review submitted successfully' };
  }

  async getChefReviews(chefId: string) {
    return this.reviewModel.find({ chef: chefId })
      .populate('customer', 'firstName lastName')
      .exec();
  }

  async calculateChefAverageRating(chefId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: { chef: chefId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ]).exec();
    
    return result.length > 0 ? result[0].averageRating : 0;
  }
}
