import * as mongoose from 'mongoose';

export const ReviewSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  chef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  showInApp: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Make event and customer combination unique to prevent multiple reviews
ReviewSchema.index({ event: 1, customer: 1 }, { unique: true });
