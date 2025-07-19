import { Document, Types } from 'mongoose';

export interface Message extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  body: string;
  createdAt: Date;
  read: boolean;
  eventId: Types.ObjectId;
  // File attachment properties
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
} 