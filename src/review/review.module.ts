import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewSchema } from './schemas/review.schema';
import { EventModule } from '../event/event.module';
import { ChefModule } from '../chef/chef.module';
import { ChefSchema } from 'src/chef/schemas/chef.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Review', schema: ReviewSchema }]),
    MongooseModule.forFeature([{ name: 'Chef', schema: ChefSchema }]),
    EventModule,
    ChefModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
