import { Document, Types } from 'mongoose';

export interface Review extends Document {
  event: Types.ObjectId;
  chef: Types.ObjectId;
  customer: Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
}
