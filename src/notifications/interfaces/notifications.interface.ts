import { Document, Types } from 'mongoose';

export interface Notifications extends Document {
  user: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  data?: {
    type?: string;
    data?: string;
  };
}
