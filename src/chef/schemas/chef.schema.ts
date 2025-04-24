import * as mongoose from 'mongoose';
import { AchievementsSchema } from 'src/achievements/schema/achievements.schema.';
import { ChefVerificationStatus } from '../interfaces/chef.interface';
import { LocationSchema } from 'src/common/schemas/location.schema';

export const BusyDaysSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  timeSlots: [{ type: String, required: true, unique: true }],
});

export const ChefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  idCard: {
    type: String,
  },
  certificates: {
    type: String,
  },
  bio: {
    type: String,
  },
  status: {
    type: String,
    enum: Object.values(ChefVerificationStatus),
    default: ChefVerificationStatus.PENDING,
  },
  rating: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  experience: {
    type: Number,
    default: 0,
  },
  locations: [LocationSchema],
  busyDays: [BusyDaysSchema],

  noOfReviews: {
    type: Number,
    default: 0
  },

  noOfFiveStars: {
    type: Number,
    default: 0
  },

  noOfFourStars: {
    type: Number,
    default: 0
  },

  avgRating: {
    type: Number,
    default: 0
  },

  completedOrders: {
    type: Number,
    default: 0
  },

  achievements: [AchievementsSchema],
});
