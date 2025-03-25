import * as mongoose from 'mongoose';
import { ChefVerificationStatus } from '../interfaces/chef.interface';

export const ChefSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  idCardUrl: {
    type: String,
    required: true,
  },
  certificationsUrl: {
    type: String,
    required: true,
  },
  cuisine: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: true,
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
});
