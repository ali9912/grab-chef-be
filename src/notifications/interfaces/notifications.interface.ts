import { Document, Types } from 'mongoose';

export interface Notifications extends Document {
  user: string;
  title: string;
  body: string;
  createdAt: Date;
  data?: {
    type?: string;
    data?: string;
  };
}
